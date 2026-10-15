import { NextRequest, NextResponse } from 'next/server';
import { tataDanaDb } from '@/lib/mock-db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if it's a manual transfer submission from web UI
    if (body.action === 'submit_manual_transfer') {
      const { userId, plan, amount, proofUrl, notes } = body;
      const orderId = `TATADANA-${plan.toUpperCase()}-${Date.now().toString().slice(-6)}`;
      const user = tataDanaDb.getUserById(userId);

      const payment = {
        id: `pay-${Date.now()}`,
        user_id: userId,
        user_name: user?.full_name || 'Pengguna',
        user_email: user?.email || '',
        order_id: orderId,
        plan: plan as 'starter' | 'pro',
        amount: Number(amount) || 99000,
        payment_method: 'manual_transfer' as const,
        status: 'pending' as const,
        proof_url: proofUrl || 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=300&q=80',
        admin_notes: notes || 'Menunggu verifikasi bukti transfer manual',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      tataDanaDb.getPayments().unshift(payment);

      return NextResponse.json({
        success: true,
        order_id: orderId,
        message: 'Bukti transfer berhasil diunggah. Tim admin TataDana akan memverifikasi dalam 1x24 jam.',
      });
    }

    // Midtrans Automated Webhook Notification
    const orderId = body.order_id;
    const transactionStatus = body.transaction_status;
    const fraudStatus = body.fraud_status;

    if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
      if (fraudStatus === 'accept' || !fraudStatus) {
        // Find payment record
        const payment = tataDanaDb.getPayments().find(p => p.order_id === orderId);
        if (payment) {
          tataDanaDb.updatePaymentStatus(payment.id, 'approved', 'system-midtrans-webhook');
        }
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
