/**
 * Self-Service Signup API - Multi-tenant Architecture
 * 
 * Permite que novos clientes se registrem automaticamente
 * Cria Organization + User + Stripe Customer em uma transação
 */

import { NextRequest, NextResponse } from 'next/server';
import { organizationService } from '@/application/services/OrganizationService';
import { logger } from '@/lib/logger';
import { PeepersPlanType } from '@/types/stripe';

interface SignupRequest {
  // Organization info
  organization_name: string;
  
  // Owner info
  name: string;
  email: string;
  
  // Plan selection
  plan_type?: PeepersPlanType;
  
  // Business info (optional)
  business_type?: 'individual' | 'business';
  tax_id?: string;
  
  // Marketing
  utm_source?: string;
  utm_campaign?: string;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Parse request
    const body: SignupRequest = await request.json();
    
    // 2. Validate required fields
    const validation = validateSignupRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // 3. Create organization + user
    const result = await organizationService.createOrganization({
      name: body.organization_name,
      ownerEmail: body.email,
      ownerName: body.name,
      planType: body.plan_type || 'starter'
    });

    // 4. Log signup event
    logger.info({
      organizationId: result.organization.id,
      userId: result.user.id,
      email: body.email,
      planType: body.plan_type,
      utmSource: body.utm_source,
      utmCampaign: body.utm_campaign
    }, 'User signup completed');

    // 5. Return success (não retornar dados sensíveis)
    return NextResponse.json({
      success: true,
      organization: {
        id: result.organization.id,
        name: result.organization.name,
        slug: result.organization.slug
      },
      next_steps: {
        verify_email: `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=TODO`,
        dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        stripe_checkout_url: result.stripeCheckoutUrl
      }
    }, { status: 201 });

  } catch (error) {
    logger.error({ error, body: request.body }, 'Signup failed');

    // Tratar erros específicos
    if (error instanceof Error) {
      if (error.message.includes('slug already exists')) {
        return NextResponse.json(
          { error: 'Organization name already taken. Please choose another.' },
          { status: 409 }
        );
      }
      
      if (error.message.includes('Email already registered')) {
        return NextResponse.json(
          { error: 'Email already registered. Please login instead.' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Signup failed. Please try again.' },
      { status: 500 }
    );
  }
}

function validateSignupRequest(body: SignupRequest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Organization name
  if (!body.organization_name || body.organization_name.trim().length < 2) {
    errors.push('Organization name must be at least 2 characters');
  }

  if (body.organization_name && body.organization_name.length > 100) {
    errors.push('Organization name must be less than 100 characters');
  }

  // User name
  if (!body.name || body.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }

  // Email
  if (!body.email || !isValidEmail(body.email)) {
    errors.push('Valid email address is required');
  }

  // Plan type
  if (body.plan_type && !['starter', 'professional', 'enterprise'].includes(body.plan_type)) {
    errors.push('Invalid plan type');
  }

  // Business type
  if (body.business_type && !['individual', 'business'].includes(body.business_type)) {
    errors.push('Business type must be individual or business');
  }

  // Tax ID (basic validation)
  if (body.tax_id && body.tax_id.length > 0) {
    // Remove special characters for validation
    const cleanTaxId = body.tax_id.replace(/[^\d]/g, '');
    if (cleanTaxId.length !== 11 && cleanTaxId.length !== 14) {
      errors.push('Tax ID must be a valid CPF (11 digits) or CNPJ (14 digits)');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Metadata da API
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';