import { Request, Response } from "express";
import prisma from "../config/database";
import { z } from "zod";
import { getOrderWithCalculations } from "../services/orderService";

const createOrderSchema = z.object({
  customerName: z.string().min(1),
  dueDate: z.string().datetime(),
  lineItems: z.array(
    z.object({
      description: z.string().min(1),
      quantity: z.number().int().positive(),
      unitPrice: z.number().nonnegative(),
    })
  ).min(1),
});

export const createOrder = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    console.log('Creating order for user:', userId);
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const { customerName, dueDate, lineItems } = createOrderSchema.parse(req.body);
    console.log('Parsed data:', { customerName, dueDate, lineItems });

    const order = await prisma.order.create({
      data: {
        userId,
        customerName,
        dueDate: new Date(dueDate),
        version: 0,
        lineItems: {
          create: lineItems.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
      include: {
        lineItems: true,
      },
    });

    console.log('Order created successfully:', order);
    return res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    if (error instanceof z.ZodError) {
      const message = error.issues?.[0]?.message || "Validation error";
      return res.status(400).json({
        error: "Validation Error",
        message,
        details: error.issues,
      });
    }
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to create order",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

// export const getOrders = async (req: Request, res: Response) => {
//   try {
//     const userId = req.user!.userId;
//     const status = req.query.status as string | undefined;

//     const where: any = { userId };
//     if (status) {
//       where.status = status;
//     }

//     const orders = await prisma.order.findMany({
//       where,
//       include: {
//         lineItems: true,
//         payments: true,
//       },
//       orderBy: { createdAt: 'desc' },
//     });

//     const ordersWithCalculations = orders.map((order: any) => {
//       const orderTotal = order.lineItems.reduce(
//         (sum: number, item: any) => sum + (item.quantity * item.unitPrice),
//         0
//       );
//       const amountPaid = order.payments.reduce((sum: number, payment: any) => sum + payment.amount, 0);
//       const amountDue = orderTotal - amountPaid;

//       return {
//         ...order,
//         orderTotal,
//         amountPaid,
//         amountDue,
//       };
//     });

//     return res.status(200).json(ordersWithCalculations);
//   } catch (error) {
//     return res.status(500).json({
//       error: "Internal Server Error",
//       message: "Failed to fetch orders",
//     });
//   }
// };

export const getOrders = async (req: Request, res: Response) => { 
  try { 
    const userId = req.user!.userId; 
    const status = req.query.status as string | undefined; 
    
    const where: any = { userId }; 
    
    if (status) { where.status = status; } 
    // First get the orders belonging to the user 
    const orders = await prisma.order.findMany({ 
      where, 
      select: { 
        id: true, 
      }, 
      orderBy: { 
        createdAt: "desc", 
      }, 
    }); 
    // Recalculate status and amounts for each order 
    const ordersWithCalculations = await Promise.all( 
      orders.map((order) => getOrderWithCalculations(order.id)) 
    ); 
    // Remove any null values 
    const validOrders = ordersWithCalculations.filter( 
      (order) => order !== null 
    ); 
    
    return res.status(200).json(validOrders); 
  } catch (error) { 
    console.error("Error fetching orders:", error); 
    
    return res.status(500).json({ 
      error: "Internal Server Error", 
      message: "Failed to fetch orders", 
    }); 
  } 
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: { id: id as string, userId },
      include: {
        lineItems: true,
        payments: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        error: "Not Found",
        message: "Order not found",
      });
    }

    const calculatedOrder = await getOrderWithCalculations(id as string);

    return res.status(200).json(calculatedOrder);
  } catch (error) {
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch order",
    });
  }
};

export const updateOrder = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { customerName, dueDate, lineItems } = req.body;

    const existingOrder = await prisma.order.findFirst({
      where: { id: id as string, userId },
      include: { payments: true },
    });

    if (!existingOrder) {
      return res.status(404).json({
        error: "Not Found",
        message: "Order not found",
      });
    }

    // Prevent editing orders with payments
    if (existingOrder.payments.length > 0) {
      return res.status(422).json({
        error: "Validation Error",
        message: "Cannot update order after payments have been recorded",
      });
    }

    const updateData: any = {};
    if (customerName !== undefined) updateData.customerName = customerName;
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);

    const order = await prisma.order.update({
      where: { id: id as string },
      data: {
        ...updateData,
        ...(lineItems && {
          lineItems: {
            deleteMany: {},
            create: lineItems.map((item: any) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
        }),
      },
      include: {
        lineItems: true,
      },
    });

    return res.status(200).json(order);
  } catch (error) {
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to update order",
    });
  }
};

export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const existingOrder = await prisma.order.findFirst({
      where: { id: id as string, userId },
      include: { payments: true },
    });

    if (!existingOrder) {
      return res.status(404).json({
        error: "Not Found",
        message: "Order not found",
      });
    }

    if (existingOrder.payments.length > 0) {
      return res.status(422).json({
        error: "Validation Error",
        message: "Cannot delete order after payments have been recorded",
      });
    }

    await prisma.order.delete({
      where: { id: id as string },
    });

    return res.status(200).json({
      message: "Order deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to delete order",
    });
  }
};