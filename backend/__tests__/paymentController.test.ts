import { createPayment } from '../src/controllers/paymentController';

// Mock the request and response objects
const mockRequest = () => {
  return {
    user: { userId: 'user-123' },
    params: { id: 'order-123' },
    body: {},
    headers: {},
  } as any;
};

const mockResponse = () => {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res;
};

jest.mock('../src/config/database', () => ({
  __esModule: true,
  default: {
    order: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback({
      order: { update: jest.fn() },
      payment: { create: jest.fn() },
    })),
  },
}));

import prisma from '../src/config/database';

describe('Payment Controller - Business Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Payment Validation', () => {
    it('should reject payment exceeding amount due', async () => {
      const req = mockRequest();
      const res = mockResponse();

      req.body = {
        amount: 1000,
        date: '2024-01-15T10:30:00Z',
        note: 'Overpayment attempt',
      };

      // Mock order with 500 total, 300 already paid
      const mockOrder = {
        id: 'order-123',
        userId: 'user-123',
        customerName: 'Test Corp',
        dueDate: new Date('2024-12-31'),
        status: 'partially_paid',
        version: 0,
        lineItems: [
          { id: 'li-1', description: 'Item', quantity: 2, unitPrice: 250 },
        ],
        payments: [
          { id: 'pay-1', amount: 300, date: new Date() },
        ],
      };

      (prisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);

      await createPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Validation Error",
          message: expect.stringContaining("exceeds amount due"),
        })
      );
    });

    it('should accept payment equal to amount due', async () => {
      const req = mockRequest();
      const res = mockResponse();

      req.body = {
        amount: 200,
        date: '2024-01-15T10:30:00Z',
        note: 'Final payment',
      };

      // Mock order with 500 total, 300 already paid
      const mockOrder = {
        id: 'order-123',
        userId: 'user-123',
        customerName: 'Test Corp',
        dueDate: new Date('2024-12-31'),
        status: 'partially_paid',
        version: 0,
        lineItems: [
          { id: 'li-1', description: 'Item', quantity: 2, unitPrice: 250 },
        ],
        payments: [
          { id: 'pay-1', amount: 300, date: new Date() },
        ],
      };

      const mockCreatedPayment = {
        id: 'pay-2',
        orderId: 'order-123',
        amount: 200,
        date: new Date('2024-01-15T10:30:00Z'),
        note: 'Final payment',
        createdAt: new Date(),
      };

      (prisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.$transaction as jest.Mock).mockResolvedValue([mockCreatedPayment, {}]);

      await createPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockCreatedPayment);
    });

    it('should accept partial payment', async () => {
      const req = mockRequest();
      const res = mockResponse();

      req.body = {
        amount: 100,
        date: '2024-01-15T10:30:00Z',
        note: 'Partial payment',
      };

      const mockOrder = {
        id: 'order-123',
        userId: 'user-123',
        customerName: 'Test Corp',
        dueDate: new Date('2024-12-31'),
        status: 'pending',
        version: 0,
        lineItems: [
          { id: 'li-1', description: 'Item', quantity: 1, unitPrice: 500 },
        ],
        payments: [],
      };

      const mockCreatedPayment = {
        id: 'pay-3',
        orderId: 'order-123',
        amount: 100,
        date: new Date('2024-01-15T10:30:00Z'),
        note: 'Partial payment',
        createdAt: new Date(),
      };

      (prisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.$transaction as jest.Mock).mockResolvedValue([mockCreatedPayment, {}]);

      await createPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockCreatedPayment);
    });

    it('should handle multiple payments correctly', async () => {
      const req = mockRequest();
      const res = mockResponse();

      req.body = {
        amount: 150,
        date: '2024-01-15T10:30:00Z',
        note: 'Second payment',
      };

      // Mock order with 500 total, 200 already paid
      const mockOrder = {
        id: 'order-123',
        userId: 'user-123',
        customerName: 'Test Corp',
        dueDate: new Date('2024-12-31'),
        status: 'partially_paid',
        version: 0,
        lineItems: [
          { id: 'li-1', description: 'Item', quantity: 1, unitPrice: 500 },
        ],
        payments: [
          { id: 'pay-1', amount: 200, date: new Date() },
        ],
      };

      const mockCreatedPayment = {
        id: 'pay-4',
        orderId: 'order-123',
        amount: 150,
        date: new Date('2024-01-15T10:30:00Z'),
        note: 'Second payment',
        createdAt: new Date(),
      };

      (prisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.$transaction as jest.Mock).mockResolvedValue([mockCreatedPayment, {}]);

      await createPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockCreatedPayment);
    });

    it('should reject zero or negative payment amount', async () => {
      const req = mockRequest();
      const res = mockResponse();

      req.body = {
        amount: -50,
        date: '2024-01-15T10:30:00Z',
        note: 'Invalid payment',
      };

      // Zod validation should fail before hitting the database
      await createPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Validation Error",
        })
      );
    });
  });

  describe('Order Status Updates', () => {
    it('should mark order as paid when fully paid', async () => {
      const req = mockRequest();
      const res = mockResponse();

      req.body = {
        amount: 500,
        date: '2024-01-15T10:30:00Z',
        note: 'Full payment',
      };

      // Mock order with 500 total, 0 paid
      const mockOrder = {
        id: 'order-123',
        userId: 'user-123',
        customerName: 'Test Corp',
        dueDate: new Date('2024-12-31'),
        status: 'pending',
        version: 0,
        lineItems: [
          { id: 'li-1', description: 'Item', quantity: 1, unitPrice: 500 },
        ],
        payments: [],
      };

      const mockCreatedPayment = {
        id: 'pay-5',
        orderId: 'order-123',
        amount: 500,
        date: new Date('2024-01-15T10:30:00Z'),
        note: 'Full payment',
        createdAt: new Date(),
      };

      (prisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.$transaction as jest.Mock).mockResolvedValue([mockCreatedPayment, {}]);
      (prisma.order.update as jest.Mock).mockResolvedValue({});

      await createPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      // Verify order update was called with paid status
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'paid' },
        })
      );
    });

    it('should mark order as partially_paid when partially paid', async () => {
      const req = mockRequest();
      const res = mockResponse();

      req.body = {
        amount: 200,
        date: '2024-01-15T10:30:00Z',
        note: 'Partial payment',
      };

      // Mock order with 500 total, 0 paid
      const mockOrder = {
        id: 'order-123',
        userId: 'user-123',
        customerName: 'Test Corp',
        dueDate: new Date('2026-12-31'),
        status: 'pending',
        version: 0,
        lineItems: [
          { id: 'li-1', description: 'Item', quantity: 1, unitPrice: 500 },
        ],
        payments: [],
      };

      const mockCreatedPayment = {
        id: 'pay-6',
        orderId: 'order-123',
        amount: 200,
        date: new Date('2024-01-15T10:30:00Z'),
        note: 'Partial payment',
        createdAt: new Date(),
      };

      (prisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.$transaction as jest.Mock).mockResolvedValue([mockCreatedPayment, {}]);
      (prisma.order.update as jest.Mock).mockResolvedValue({});

      await createPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      // Verify order update was called with partially_paid status
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'partially_paid' },
        })
      );
    });
  });
});