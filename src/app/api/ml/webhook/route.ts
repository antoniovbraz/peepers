import { NextRequest, NextResponse } from 'next/server';
import { MLWebhook } from '@/types/ml';
import { cache } from '@/lib/cache';
import { revalidatePath } from 'next/cache';
import crypto from 'node:crypto';
import { createMercadoLivreAPI } from '@/lib/ml-api';
import logger from '@/lib/logger';

const mlApi = createMercadoLivreAPI(
  { fetch },
  {
    clientId: process.env.ML_CLIENT_ID!,
    clientSecret: process.env.ML_CLIENT_SECRET!,
    accessToken: process.env.ML_ACCESS_TOKEN,
    refreshToken: process.env.ML_REFRESH_TOKEN,
    userId: process.env.ML_USER_ID
  }
);

// revalidatePath requires the Node.js runtime
export const runtime = 'nodejs';
export const maxDuration = 10;

function timingSafeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, 'hex');
  const bBuf = Buffer.from(b, 'hex');
  if (aBuf.length !== bBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const secret = process.env.ML_WEBHOOK_SECRET ?? '';
    const signature = request.headers.get('x-ml-signature') ?? '';

    // Read raw body for signature verification
    const rawBody = await request.text();
    const expectedSignature = secret
      ? crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
      : '';

    if (!secret || !signature || !timingSafeEqual(signature, expectedSignature)) {
      logger.warn('Invalid webhook signature');
      logger.info('metric.webhook.invalid_signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse webhook payload
    const webhook: MLWebhook = JSON.parse(rawBody);
    
    logger.info('Webhook received:', {
      topic: webhook.topic,
      resource: webhook.resource,
      user_id: webhook.user_id,
      attempts: webhook.attempts
    });

    // Validate webhook (basic validation)
    if (!webhook.topic || !webhook.resource || !webhook.user_id) {
      logger.error('Invalid webhook payload:', webhook);
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Process webhook based on topic
    await processWebhook(webhook);
    
    const processingTime = Date.now() - startTime;
    logger.info(`Webhook processed in ${processingTime}ms`);
    
    // Always return 200 within 500ms as required by ML
    return NextResponse.json({ 
      status: 'processed',
      topic: webhook.topic,
      processing_time_ms: processingTime
    });
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    logger.error('Webhook processing failed:', error, `(${processingTime}ms)`);
    
    // Still return 200 to avoid retries for malformed requests
    return NextResponse.json({ 
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      processing_time_ms: processingTime
    });
  }
}

async function processWebhook(webhook: MLWebhook): Promise<void> {
  try {
    switch (webhook.topic) {
      case 'items':
        await handleItemsWebhook(webhook);
        break;
        
      case 'questions':
        await handleQuestionsWebhook(webhook);
        break;
        
      case 'orders_v2':
        await handleOrdersWebhook(webhook);
        break;
        
      case 'messages':
        await handleMessagesWebhook(webhook);
        break;
        
      case 'price_suggestion':
        await handlePriceSuggestionWebhook(webhook);
        break;
        
      default:
        logger.info(`Unhandled webhook topic: ${webhook.topic}`);
    }
  } catch (error) {
    logger.error(`Error processing ${webhook.topic} webhook:`, error);
    throw error;
  }
}

async function handleItemsWebhook(webhook: MLWebhook): Promise<void> {
  try {
    // Extract item ID from resource path
    const itemId = webhook.resource.split('/').pop();
    if (!itemId) {
      logger.error('Could not extract item ID from resource:', webhook.resource);
      return;
    }

    logger.info(`Processing item update for: ${itemId}`);
    
    // Invalidate product cache
    await cache.invalidateProduct(itemId);
    
    // Try to fetch fresh product data and update cache
    try {
      const product = await mlApi.getProduct(itemId);
      await cache.setProduct(product);
      logger.info(`Updated cache for product: ${itemId}`);
    } catch (error) {
      logger.error(`Failed to fetch updated product ${itemId}:`, error);
      // Don't throw - cache invalidation was successful
    }
    
    // Revalidate ISR pages
    try {
      await revalidatePath(`/produtos/${itemId}`);
      await revalidatePath('/produtos');
      logger.info(`Revalidated ISR pages for product: ${itemId}`);
    } catch (error) {
      logger.error(`Failed to revalidate pages for ${itemId}:`, error);
    }
    
  } catch (error) {
    logger.error('Items webhook processing failed:', error);
    throw error;
  }
}

async function handleQuestionsWebhook(webhook: MLWebhook): Promise<void> {
  try {
    // Extract question ID from resource path
    const questionId = webhook.resource.split('/').pop();
    if (!questionId) {
      logger.error('Could not extract question ID from resource:', webhook.resource);
      return;
    }

    logger.info(`Processing question update for: ${questionId}`);

    if (!mlApi.hasAccessToken()) {
      logger.info('Skipping question processing: no access token');
      return;
    }

    // Get question details to find the item ID
    try {
      const question = await mlApi.getQuestion(questionId);
      const itemId = question.item_id;

      // Invalidate questions cache for this product
      await cache.invalidateProductQuestions(itemId);

      // Fetch fresh questions and update cache
      const questionsResponse = await mlApi.getProductQuestions(itemId);
      await cache.setProductQuestions(itemId, questionsResponse.questions);

      // Revalidate product page to show updated Q&A
      await revalidatePath(`/produtos/${itemId}`);

      logger.info(`Updated questions cache for product: ${itemId}`);

    } catch (error) {
      logger.error(`Failed to process question ${questionId}:`, error);
      // Don't throw - we still want to acknowledge the webhook
    }
    
  } catch (error) {
    logger.error('Questions webhook processing failed:', error);
    throw error;
  }
}

async function handleOrdersWebhook(webhook: MLWebhook): Promise<void> {
  try {
    // Extract order ID from resource path
    const orderId = webhook.resource.split('/').pop();
    if (!orderId) {
      logger.error('Could not extract order ID from resource:', webhook.resource);
      return;
    }

    logger.info(`Processing order update for: ${orderId}`);

    if (!mlApi.hasAccessToken()) {
      logger.info('Skipping order processing: no access token');
      return;
    }

    // For now, just log the order update
    // In the future, you might want to:
    // - Update inventory counts
    // - Send notifications
    // - Update analytics
    
    try {
      const order = await mlApi.getOrder(orderId);
      logger.info(`Order ${orderId} status: ${order.status}`);
      
      // If order affects inventory, invalidate product cache
      if (order.status === 'paid' || order.status === 'confirmed') {
        for (const item of order.order_items) {
          await cache.invalidateProduct(item.item.id);
        }
      }
      
    } catch (error) {
      logger.error(`Failed to fetch order ${orderId}:`, error);
    }
    
  } catch (error) {
    logger.error('Orders webhook processing failed:', error);
    throw error;
  }
}

async function handleMessagesWebhook(webhook: MLWebhook): Promise<void> {
  try {
    logger.info(`Processing message update: ${webhook.resource}`);
    
    // For now, just log the message update
    // In the future, you might want to:
    // - Send notifications to admin
    // - Update message counts
    // - Trigger automated responses
    
    logger.info(`Message webhook processed: ${webhook.resource}`);
    
  } catch (error) {
    logger.error('Messages webhook processing failed:', error);
    throw error;
  }
}

async function handlePriceSuggestionWebhook(webhook: MLWebhook): Promise<void> {
  try {
    logger.info(`Processing price suggestion: ${webhook.resource}`);
    
    // Extract item ID from resource path
    const resourceParts = webhook.resource.split('/');
    const itemIdIndex = resourceParts.indexOf('items') + 1;
    const itemId = resourceParts[itemIdIndex];
    
    if (itemId) {
      logger.info(`Price suggestion for item: ${itemId}`);
      
      // For now, just log the suggestion
      // In the future, you might want to:
      // - Store suggestions for analysis
      // - Send notifications to admin
      // - Automatically adjust prices based on rules
    }
    
  } catch (error) {
    logger.error('Price suggestion webhook processing failed:', error);
    throw error;
  }
}

// Health check endpoint
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'healthy',
    webhook_endpoint: '/api/ml/webhook',
    supported_topics: ['items', 'questions', 'orders_v2', 'messages', 'price_suggestion'],
    timestamp: new Date().toISOString()
  });
}
