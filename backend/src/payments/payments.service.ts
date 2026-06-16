import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { JobStatus } from '@prisma/client';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.stripe = new Stripe(this.config.get<string>('STRIPE_SECRET_KEY')!);
  }

  // ─── CREATE CHECKOUT SESSION ──────────────────────────────
  async createCheckoutSession(jobId: string, employerId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');

    // ownership check — only the job's employer can pay for it
    if (job.employerId !== employerId)
      throw new ForbiddenException('You do not own this job');

    const frontendUrl = this.config.get<string>('FRONTEND_URL');

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Job posting: ${job.title}`,
              description: 'Publish your job listing for 30 days',
            },
            unit_amount: 900, // $9.00 in cents
          },
          quantity: 1,
        },
      ],
      // store the jobId so the webhook knows which job to activate
      metadata: { jobId: job.id },
      success_url: `${frontendUrl}/dashboard/employer?payment=success`,
      cancel_url: `${frontendUrl}/dashboard/employer?payment=cancelled`,
    });

    return { url: session.url };
  }

  // ─── HANDLE WEBHOOK ───────────────────────────────────────
  async handleWebhook(signature: string, rawBody: Buffer) {
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET')!;

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (err) {
      throw new ForbiddenException(`Webhook signature verification failed`);
    }

    // we only care about completed checkouts
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const jobId = session.metadata?.jobId;

      if (jobId) {
        await this.prisma.job.update({
          where: { id: jobId },
          data: {
            status: JobStatus.ACTIVE,
            stripePaymentId: session.id,
          },
        });
      }
    }

    return { received: true };
  }
}
