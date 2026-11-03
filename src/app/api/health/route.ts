import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { databaseErrorResponse } from '@/lib/apiErrors';
import { connectDB, getConfiguredDatabaseName } from '@/lib/db';
import { Cafe } from '@/models/Cafe';
import { EmailLog } from '@/models/EmailLog';
import { NotificationRequest } from '@/models/NotificationRequest';
import { Offer } from '@/models/Offer';
import { User } from '@/models/User';
import { UserNotification } from '@/models/UserNotification';

export async function GET() {
  try {
    await connectDB();
    const [users, cafes, offers, notifications, userNotifications, emailLogs] = await Promise.all([
      User.countDocuments(),
      Cafe.countDocuments(),
      Offer.countDocuments(),
      NotificationRequest.countDocuments(),
      UserNotification.countDocuments(),
      EmailLog.countDocuments(),
    ]);
    const legacyCafeDocuments = await mongoose.connection.db!.collection('caves').countDocuments();

    return NextResponse.json({
      success: true,
      message: 'WHEN IN API and MongoDB are healthy',
      timestamp: new Date().toISOString(),
      developmentSeedEnabled: process.env.NODE_ENV === 'development',
      database: {
        status: 'connected',
        configuredName: getConfiguredDatabaseName(),
        activeName: mongoose.connection.name,
        collections: {
          users: { name: User.collection.name, documents: users },
          cafes: { name: Cafe.collection.name, documents: cafes },
          legacyCafeCollection: { name: 'caves', documents: legacyCafeDocuments },
          offers: { name: Offer.collection.name, documents: offers },
          notifications: { name: NotificationRequest.collection.name, documents: notifications },
          userNotifications: { name: UserNotification.collection.name, documents: userNotifications },
          emailLogs: { name: EmailLog.collection.name, documents: emailLogs },
        },
      },
    });
  } catch (error) {
    const response = databaseErrorResponse(error, 'Health check');
    return NextResponse.json(
      {
        success: false,
        message: 'WHEN IN API is running, but MongoDB is unavailable.',
        timestamp: new Date().toISOString(),
        developmentSeedEnabled: process.env.NODE_ENV === 'development',
        database: {
          status: 'unavailable',
          configuredName: getConfiguredDatabaseName(),
        },
      },
      { status: response.status },
    );
  }
}
