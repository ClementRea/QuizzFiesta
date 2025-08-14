const request = require('supertest');

jest.mock('stripe', () => {
	const create = jest.fn();
	const instance = { checkout: { sessions: { create } } };
	const factory = jest.fn(() => instance);
	factory.__create = create;
	return factory;
});

const stripeFactory = require('stripe');

describe('PaymentController createCheckoutSession', () => {
	let app;
	beforeAll(() => {
		process.env.STRIPE_SECRET_KEY = 'sk_test_123';
		process.env.STRIPE_PRICE_ID = 'price_123';
		process.env.FRONTEND_URL = 'http://frontend.test';
		app = require('../../src/app');
	});

	beforeEach(() => {
		stripeFactory.__create.mockReset();
	});

	test('returns checkout session url', async () => {
		stripeFactory.__create.mockResolvedValue({ url: 'https://checkout.stripe.com/test_session' });
		const res = await request(app).post('/api/payment/create-checkout-session');
		expect(res.status).toBe(200);
		expect(res.body).toHaveProperty('url', 'https://checkout.stripe.com/test_session');
		expect(stripeFactory).toHaveBeenCalledWith('sk_test_123');
		expect(stripeFactory.__create).toHaveBeenCalledTimes(1);
		const args = stripeFactory.__create.mock.calls[0][0];
		expect(args.mode).toBe('payment');
		expect(args.line_items[0]).toEqual({ price: 'price_123', quantity: 1 });
		expect(args.success_url).toBe('http://frontend.test/#/payment/success');
		expect(args.cancel_url).toBe('http://frontend.test/#/payment/cancel');
	});

	test('handles stripe error', async () => {
		stripeFactory.__create.mockRejectedValue(new Error('Stripe failure'));
		const res = await request(app).post('/api/payment/create-checkout-session');
		expect(res.status).toBe(500);
		expect(res.body).toHaveProperty('error', 'Stripe failure');
	});
});
