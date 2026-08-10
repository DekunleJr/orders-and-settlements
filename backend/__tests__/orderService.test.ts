import { getOrderWithCalculations } from '../src/services/orderService';

// Mock the prisma module
jest.mock('../src/config/database', () => ({
  __esModule: true,
  default: {
    order: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    lineItem: {
      findMany: jest.fn(),
    },
    payment: {
      findMany: jest.fn(),
    },
  },
}));

import prisma from '../src/config/database';

describe('Order Service - Business Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrderWithCalculations', () => {
    it('should calculate order totals correctly', async () => {
      const mockOrder = {
        id: 'order-123',
        userId: 'user-123',
        customerName: 'Acme Corp',
        dueDate: new Date('2024-12-31'),
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        lineItems: [
          { id: 'li-1', orderId: 'order-123', description: 'Widget A', quantity: 2, unitPrice: 100 },
          { id: 'li-2', orderId: 'order-123', description: 'Widget B', quantity: 1, unitPrice: 200 },
        ],
        payments: [
          { id: 'pay-1', orderId: 'order-123', amount: 150, date: new Date(), note: 'Partial', createdAt: new Date() },
        ],
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      const result = await getOrderWithCalculations('order-123');

      expect(result).not.toBeNull();
      // Order total: (2 * 100) + (1 * 200) = 400
      expect(result!.orderTotal).toBe(400);
      // Amount paid: 150
      expect(result!.amountPaid).toBe(150);
      // Amount due: 400 - 150 = 250
      expect(result!.amountDue).toBe(250);
    });

    it('should handle orders with no payments', async () => {
      const mockOrder = {
        id: 'order-456',
        userId: 'user-123',
        customerName: 'Test Corp',
        dueDate: new Date('2024-12-31'),
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        lineItems: [
          { id: 'li-3', orderId: 'order-456', description: 'Item A', quantity: 1, unitPrice: 500 },
        ],
        payments: [],
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      const result = await getOrderWithCalculations('order-456');

      expect(result).not.toBeNull();
      expect(result!.orderTotal).toBe(500);
      expect(result!.amountPaid).toBe(0);
      expect(result!.amountDue).toBe(500);
    });

    it('should handle fully paid orders', async () => {
      const mockOrder = {
        id: 'order-789',
        userId: 'user-123',
        customerName: 'Paid Corp',
        dueDate: new Date('2024-12-31'),
        status: 'paid',
        createdAt: new Date(),
        updatedAt: new Date(),
        lineItems: [
          { id: 'li-4', orderId: 'order-789', description: 'Item X', quantity: 3, unitPrice: 100 },
        ],
        payments: [
          { id: 'pay-2', orderId: 'order-789', amount: 300, date: new Date(), note: 'Full payment', createdAt: new Date() },
        ],
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      const result = await getOrderWithCalculations('order-789');

      expect(result).not.toBeNull();
      // Order total: 3 * 100 = 300
      expect(result!.orderTotal).toBe(300);
      // Amount paid: 300
      expect(result!.amountPaid).toBe(300);
      // Amount due: 0
      expect(result!.amountDue).toBe(0);
    });

    it('should handle multiple payments correctly', async () => {
      const mockOrder = {
        id: 'order-multi',
        userId: 'user-123',
        customerName: 'Multi Payment Corp',
        dueDate: new Date('2024-12-31'),
        status: 'partially_paid',
        createdAt: new Date(),
        updatedAt: new Date(),
        lineItems: [
          { id: 'li-5', orderId: 'order-multi', description: 'Item M', quantity: 1, unitPrice: 1000 },
        ],
        payments: [
          { id: 'pay-3', orderId: 'order-multi', amount: 300, date: new Date(), note: 'First', createdAt: new Date() },
          { id: 'pay-4', orderId: 'order-multi', amount: 200, date: new Date(), note: 'Second', createdAt: new Date() },
          { id: 'pay-5', orderId: 'order-multi', amount: 100, date: new Date(), note: 'Third', createdAt: new Date() },
        ],
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      const result = await getOrderWithCalculations('order-multi');

      expect(result).not.toBeNull();
      expect(result!.orderTotal).toBe(1000);
      expect(result!.amountPaid).toBe(600); // 300 + 200 + 100
      expect(result!.amountDue).toBe(400);
    });

    it('should handle decimal quantities and prices', async () => {
      const mockOrder = {
        id: 'order-decimal',
        userId: 'user-123',
        customerName: 'Decimal Corp',
        dueDate: new Date('2024-12-31'),
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        lineItems: [
          { id: 'li-6', orderId: 'order-decimal', description: 'Item D', quantity: 3, unitPrice: 99.99 },
        ],
        payments: [],
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      const result = await getOrderWithCalculations('order-decimal');

      expect(result).not.toBeNull();
      // 3 * 99.99 = 299.97
      expect(result!.orderTotal).toBeCloseTo(299.97, 2);
      expect(result!.amountPaid).toBe(0);
      expect(result!.amountDue).toBeCloseTo(299.97, 2);
    });
  });
});