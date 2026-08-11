import { createPayment } from '../src/controllers/paymentController';

/**
 * @jest-environment node
 */

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
    $transaction: jest.fn((operations) => Promise.all(operations)),
  },
}));

import prisma from '../src/config/database';

describe('Refund Feature', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Refund Validation', () => {
    it('should accept refund within net paid amount', async () => {
      const req = mockRequest();
      const res = mockResponse();

      req.body = {
        amount: 200,
        date: '2024-01-15T10:30:00Z',
        note: 'Partial refund',
        isRefund: true,
      };
      req.headers = {};

      const mockOrder = {
        id: 'order-123',
        userId: 'user-123',
        customerName: 'Test Corp',
        dueDate: new Date('2024-12-31'),
        status: 'paid',
        version: 0,
        lineItems: [
          { id: 'li-1', description: 'Item', quantity: 1, unitPrice: 500 },
        ],
        payments: [
          { id: 'pay-1', amount: 500, date: new Date(), isRefund: false, note: 'Full payment' },
        ],
      };

      const mockRefund = {
        id: 'pay-2',
        orderId: 'order-123',
        amount: -200,
        isRefund: true,
        date: new Date('2024-01-15T10:30:00Z'),
        note: 'Partial refund',
        createdAt: new Date(),
      };

      (prisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.$transaction as jest.Mock).mockResolvedValue([mockRefund, {}]);

      await createPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockRefund);
    });

    it('should reject refund exceeding net paid amount', async () => {
      const req = mockRequest();
      const res = mockResponse();

      req.body = {
        amount: 600,
        date: '2024-01-15T10:30:00Z',
        note: 'Invalid refund',
        isRefund: true,
      };

      const mockOrder = {
        id: 'order-123',
        userId: 'user-123',
        customerName: 'Test Corp',
        dueDate: new Date('2024-12-31'),
        status: 'paid',
        version: 0,
        lineItems: [
          { id: 'li-1', description: 'Item', quantity: 1, unitPrice: 500 },
        ],
        payments: [
          { id: 'pay-1', amount: 500, date: new Date(), isRefund: false, note: 'Full payment' },
        ],
      };

      (prisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);

      await createPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Validation Error",
          message: expect.stringContaining("exceeds maximum refundable amount"),
        })
      );
    });

    it('should handle refund with previous refunds', async () => {
      const req = mockRequest();
      const res = mockResponse();

      req.body = {
        amount: 100,
        date: '2024-01-15T10:30:00Z',
        note: 'Additional refund',
        isRefund: true,
      };

      const mockOrder = {
        id: 'order-123',
        userId: 'user-123',
        customerName: 'Test Corp',
        dueDate: new Date('2024-12-31'),
        status: 'paid',
        version: 0,
        lineItems: [
          { id: 'li-1', description: 'Item', quantity: 1, unitPrice: 500 },
        ],
        payments: [
          { id: 'pay-1', amount: 500, isRefund: false, date: new Date(), note: 'Full payment' },
          { id: 'pay-2', amount: -200, isRefund: true, date: new Date(), note: 'First refund' },
        ],
      };

      const mockRefund = {
        id: 'pay-3',
        orderId: 'order-123',
        amount: -100,
        isRefund: true,
        date: new Date('2024-01-15T10:30:00Z'),
        note: 'Additional refund',
        createdAt: new Date(),
      };

      (prisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.$transaction as jest.Mock).mockResolvedValue([mockRefund, {}]);

      await createPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockRefund);
    });
  });
});