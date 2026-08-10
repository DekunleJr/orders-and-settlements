import { Request, Response } from "express";
import prisma from "../config/database";
import { z } from "zod";

const createPaymentSchema = z.object({
  amount: z.number().positive(),
  date: z.string().datetime().optional(),
  note: z.string().optional(),
});

export const createPayment = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id: orderId } = req.params;
    const { amount, date, note } = createPaymentSchema.parse(req.body);

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

    // Calculate order total and amount paid
    const orderTotal = order.lineItems.reduce(
      (sum: number, item: any) => sum + (item.quantity * item.unitPrice),
      0
    );
    const amountPaid = order.payments.reduce((sum: number, payment: any) => sum + payment.amount, 0);
    const amountDue = orderTotal - amountPaid;

    // Validate payment amount
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

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        amount,
        date: date ? new Date(date) : new Date(),
        note: note || null,
      },
    });

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
      await prisma.order.update({
        where: { id: orderId as string },
        data: { status: newStatus },
      });
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