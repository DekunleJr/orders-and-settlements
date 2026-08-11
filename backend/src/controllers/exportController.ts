import { Request, Response } from "express";
import prisma from "../config/database";

export const exportOrdersCSV = async (req: Request, res: Response) => {
  try {
    console.log("Export CSV - req.user:", req.user);
    console.log("Export CSV - userId:", req.user?.userId);
    
    const userId = req.user?.userId;
    if (!userId) {
      console.error("Export CSV - No userId found in req.user");
      return res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
    }

    const { startDate, endDate } = req.query;
    console.log("Export CSV - Query params:", { startDate, endDate });

    const where: any = { userId };
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        lineItems: true,
        payments: {
          orderBy: { date: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`Export CSV - Found ${orders.length} orders for user ${userId}`);
    
    if (orders.length === 0) {
      console.log(`Export CSV - No orders found for user ${userId}`);
      return res.status(404).json({
        error: "Not Found",
        message: `No orders found for your account (user ID: ${userId}). Make sure you're logged in with the correct account that created the orders.`,
      });
    }

    // Prepare CSV data
    const csvData: any[] = [];

    for (const order of orders) {
      const orderTotal = order.lineItems.reduce(
        (sum: number, item: any) => sum + (item.quantity * item.unitPrice),
        0
      );
      const amountPaid = order.payments.reduce((sum: number, payment: any) => sum + payment.amount, 0);
      const amountDue = orderTotal - amountPaid;

      // Add order header row
      csvData.push({
        OrderID: order.id,
        Customer: order.customerName,
        DueDate: order.dueDate.toISOString().split('T')[0],
        Status: order.status,
        OrderTotal: orderTotal.toFixed(2),
        AmountPaid: amountPaid.toFixed(2),
        AmountDue: amountDue.toFixed(2),
        CreatedAt: order.createdAt.toISOString(),
        LineItem: "",
        LineItemQty: "",
        LineItemPrice: "",
        PaymentDate: "",
        PaymentAmount: "",
        PaymentNote: "",
      });

      // Add line items
      for (const item of order.lineItems) {
        csvData.push({
          OrderID: "",
          Customer: "",
          DueDate: "",
          Status: "",
          OrderTotal: "",
          AmountPaid: "",
          AmountDue: "",
          CreatedAt: "",
          LineItem: item.description,
          LineItemQty: item.quantity,
          LineItemPrice: item.unitPrice.toFixed(2),
          PaymentDate: "",
          PaymentAmount: "",
          PaymentNote: "",
        });
      }

      // Add payments
      for (const payment of order.payments) {
        csvData.push({
          OrderID: "",
          Customer: "",
          DueDate: "",
          Status: "",
          OrderTotal: "",
          AmountPaid: "",
          AmountDue: "",
          CreatedAt: "",
          LineItem: "",
          LineItemQty: "",
          LineItemPrice: "",
          PaymentDate: payment.date.toISOString().split('T')[0],
          PaymentAmount: payment.amount.toFixed(2),
          PaymentNote: payment.note || "",
        });
      }

      // Add empty row for separation
      csvData.push({
        OrderID: "",
        Customer: "",
        DueDate: "",
        Status: "",
        OrderTotal: "",
        AmountPaid: "",
        AmountDue: "",
        CreatedAt: "",
        LineItem: "",
        LineItemQty: "",
        LineItemPrice: "",
        PaymentDate: "",
        PaymentAmount: "",
        PaymentNote: "",
      });
    }

    console.log(`Export CSV - Generated CSV with ${csvData.length} rows`);
    
    // Set response headers for CSV download
    const filename = `orders_export_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Generate CSV manually
    const headers = [
      "Order ID", "Customer", "Due Date", "Status", "Order Total", "Amount Paid", "Amount Due", "Created At",
      "Line Item", "Qty", "Unit Price", "Payment Date", "Payment Amount", "Payment Note"
    ];

    const csvRows = [headers.join(",")];

    for (const row of csvData) {
      const values = [
        row.OrderID,
        `"${row.Customer}"`,
        row.DueDate,
        row.Status,
        row.OrderTotal,
        row.AmountPaid,
        row.AmountDue,
        row.CreatedAt,
        `"${row.LineItem}"`,
        row.LineItemQty,
        row.LineItemPrice,
        row.PaymentDate,
        row.PaymentAmount,
        `"${row.PaymentNote}"`
      ];
      csvRows.push(values.join(","));
    }

    const csvContent = csvRows.join("\n");

    res.send(csvContent);
  } catch (error) {
    console.error("CSV export error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to export orders",
    });
  }
};