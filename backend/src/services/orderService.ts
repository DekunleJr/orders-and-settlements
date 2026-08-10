import prisma from "../config/database";

export const calculateOrderStatus = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      lineItems: true,
      payments: true,
    },
  });

  if (!order) {
    return null;
  }

  const orderTotal = order.lineItems.reduce(
    (sum: number, item: any) => sum + (item.quantity * item.unitPrice),
    0
  );
  const amountPaid = order.payments.reduce((sum: number, payment: any) => sum + payment.amount, 0);
  const isFullyPaid = amountPaid >= orderTotal;

  // If fully paid, status is "paid" regardless of due date
  if (isFullyPaid) {
    return "paid";
  }

  // Check if overdue (past due date and not fully paid)
  const isOverdue = new Date() > order.dueDate;

  if (isOverdue) {
    return "overdue";
  }

  // Determine if pending or partially_paid
  if (amountPaid > 0) {
    return "partially_paid";
  }

  return "pending";
};

export const getOrderWithCalculations = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      lineItems: true,
      payments: {
        orderBy: { date: "desc" },
      },
    },
  });

  if (!order) {
    return null;
  }

  const orderTotal = order.lineItems.reduce(
    (sum: number, item: any) => sum + (item.quantity * item.unitPrice),
    0
  );
  const amountPaid = order.payments.reduce((sum: number, payment: any) => sum + payment.amount, 0);
  const amountDue = orderTotal - amountPaid;

  return {
    ...order,
    orderTotal,
    amountPaid,
    amountDue,
  };
};