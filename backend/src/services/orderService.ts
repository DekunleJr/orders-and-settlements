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

export const createAuditLog = async (orderId: string, userId: string, oldStatus: string | undefined, newStatus: string) => {
  await prisma.auditLog.create({
    data: {
      orderId,
      userId,
      oldStatus,
      newStatus,
    },
  });
};

export const calculateOrderStatusFromData = (order: any) => {
  const orderTotal = order.lineItems.reduce(
    (sum: number, item: any) => sum + (item.quantity * item.unitPrice),
    0
  );
  const amountPaid = (order.payments || []).reduce((sum: number, payment: any) => sum + payment.amount, 0);
  const isFullyPaid = amountPaid >= orderTotal;

  if (isFullyPaid) {
    return "paid";
  }

  const isOverdue = new Date() > order.dueDate;

  if (isOverdue) {
    return "overdue";
  }

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

  // Dynamically calculate the current status (handles overdue detection)
  const calculatedStatus = calculateOrderStatusFromData(order);

  console.log(`Calculated status for order ${orderId}: ${calculatedStatus}`);

  // Persist status change to DB if needed
  if (calculatedStatus !== order.status) {
    const oldStatus = order.status;
    await prisma.order.update({
      where: { id: orderId },
      data: { status: calculatedStatus },
    });
    
    // Create audit log entry for status change
    await createAuditLog(orderId, order.userId, oldStatus, calculatedStatus);
  }

  return {
    ...order,
    orderTotal,
    amountPaid,
    amountDue,
    status: calculatedStatus,
  };
};
