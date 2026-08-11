import { Request, Response } from "express";
import prisma from "../config/database";
import { z } from "zod";
import { createAuditLog } from "../services/orderService";

const createPaymentSchema = z.object({
  amount: z.number().positive(),
  date: z.string().datetime().optional(),
  note: z.string().optional(),
  isRefund: z.boolean().default(false),
});

const createRefundSchema = z.object({
  amount: z.number().positive(),
  date: z.string().datetime().optional(),
  note: z.string().optional(),
});

export const createPayment = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
    }
    const orderId = req.params.id as string;
    const { amount, date, note, isRefund } = createPaymentSchema.parse(req.body);

    // Verify order exists and belongs to user
    const order = await prisma.order.findFirst({
      where: { id: orderId as string, userId },
      include: {
        lineItems: true,
        payments: true,
      },
    }) as any;

    if (!order) {
      return res.status(404).json({
        error: "Not Found",
        message: "Order not found",
      });
    }

    // Optimistic locking: check version
    const clientVersion = req.headers['x-order-version'];
    if (clientVersion && parseInt(clientVersion as string) !== order.version) {
      return res.status(409).json({
        error: "Conflict",
        message: "Order was modified by another request. Please refresh and try again.",
        details: {
          currentVersion: order.version,
        },
      });
    }

    // Calculate order total and amount paid (including refunds)
    const orderTotal = order.lineItems.reduce(
      (sum: number, item: any) => sum + (item.quantity * item.unitPrice),
      0
    );
    const amountPaid = order.payments.reduce((sum: number, payment: any) => sum + payment.amount, 0);
    const amountDue = orderTotal - amountPaid;

    // For refunds, validate differently
    if (isRefund) {
      const currentPaidAmount = order.payments
        .filter((p: any) => !p.isRefund)
        .reduce((sum: number, payment: any) => sum + payment.amount, 0);
      const currentRefundAmount = order.payments
        .filter((p: any) => p.isRefund)
        .reduce((sum: number, payment: any) => sum + payment.amount, 0);
      
      const netPaid = currentPaidAmount - currentRefundAmount;
      const maxRefund = netPaid;
      
      if (amount > maxRefund) {
        return res.status(422).json({
          error: "Validation Error",
          message: `Refund amount (${amount}) exceeds maximum refundable amount (${maxRefund})`,
          details: {
            orderTotal,
            currentPaid: currentPaidAmount,
            currentRefunds: currentRefundAmount,
            maxAllowed: maxRefund,
          },
        });
      }
      
      const refundAmount = -amount;
      
      // Create refund and increment version atomically
      const [payment] = await prisma.$transaction([
        prisma.payment.create({
          data: {
            orderId: order.id,
            amount: refundAmount,
            isRefund: true,
            date: date ? new Date(date) : new Date(),
            note: note || null,
          },
        }),
        prisma.order.update({
          where: { id: orderId as string, version: order.version },
          data: { version: { increment: 1 } },
        }),
      ]);

      return res.status(201).json(payment);
    }

    // For regular payments
    if (amount > amountDue) {
      return res.status(422).json({
        error: "Validation Error",
        message: `Payment amount (${amount}) exceeds amount due (${amountDue})`,
        details: {
          orderTotal,
          amountPaid,
          amountDue,
          maxAllowed: amountDue,
        },
      });
    }

    // Create payment and increment version atomically
    const [payment] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          orderId: order.id,
          amount,
          date: date ? new Date(date) : new Date(),
          note: note || null,
        },
      }),
      prisma.order.update({
        where: { id: orderId as string, version: order.version },
        data: { version: { increment: 1 } },
      }),
    ]);

    // Update order status based on new payment
    const newAmountPaid = amountPaid + amount;
    let newStatus = order.status;

    if (newAmountPaid >= orderTotal) {
      newStatus = "paid";
    } else if (newAmountPaid > 0) {
      newStatus = "partially_paid";
    }

    // Check if overdue
    const isOverdue = new Date() > order.dueDate && newAmountPaid < orderTotal;
    if (isOverdue) {
      newStatus = "overdue";
    }

    // Update order status if changed
    if (newStatus !== order.status) {
      const oldStatus = order.status;
      await prisma.order.update({
        where: { id: orderId as string },
        data: { status: newStatus },
      });
      
      if (userId) {
        await createAuditLog(orderId, userId, oldStatus, newStatus);
      }
    }

    return res.status(201).json(payment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues?.[0]?.message || "Validation error";
      return res.status(400).json({
        error: "Validation Error",
        message,
      });
    }
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to record payment",
    });
  }
};

export const getAuditLog = async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id as string;
    const userId = req.user?.userId;

    const order = await prisma.order.findFirst({
      where: { id: orderId as string, userId },
    });

    if (!order) {
      return res.status(404).json({
        error: "Not Found",
        message: "Order not found",
      });
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: { orderId: orderId as string },
      orderBy: { changedAt: "desc" },
    });

    return res.status(200).json(auditLogs);
  } catch (error) {
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch audit log",
    });
  }
};