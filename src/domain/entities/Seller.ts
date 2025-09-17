/**
 * Seller Entity - Core business entity for Mercado Livre sellers
 * 
 * This entity encapsulates all business logic related to sellers,
 * following Clean Architecture principles in the domain layer.
 */

export interface SellerAddress {
  id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: {
    id: string;
    name: string;
  };
}

export interface SellerPhone {
  area_code: string;
  number: string;
  extension?: string;
  verified: boolean;
}

export interface SellerIdentification {
  type: string;
  number: string;
}

export interface SellerReputation {
  level_id: string;
  power_seller_status: 'GOLD' | 'SILVER' | 'BRONZE' | null;
  transactions: {
    period: string;
    total: number;
    canceled: number;
    completed: number;
    ratings: {
      positive: number;
      negative: number;
      neutral: number;
    };
  };
  metrics: {
    claims: {
      period: string;
      rate: number;
      value: number;
    };
    delayed_handling_time: {
      period: string;
      rate: number;
      value: number;
    };
    sales: {
      period: string;
      completed: number;
    };
  };
}

export interface SellerStatus {
  site_status: 'active' | 'inactive' | 'suspended';
  list: {
    allow: boolean;
    codes: string[];
    immediate_payment: {
      reasons: string[];
      required: boolean;
    };
  };
  buy: {
    allow: boolean;
    codes: string[];
    immediate_payment: {
      reasons: string[];
      required: boolean;
    };
  };
  sell: {
    allow: boolean;
    codes: string[];
    immediate_payment: {
      reasons: string[];
      required: boolean;
    };
  };
  billing: {
    allow: boolean;
    codes: string[];
  };
  mercadopago_tc_accepted: boolean;
  mercadopago_account_type: string;
  mercadoshops: string;
  immediate_payment: boolean;
  confirmed_email: boolean;
  user_type: 'normal' | 'company';
}

export class Seller {
  constructor(
    public readonly id: number,
    public readonly nickname: string,
    public readonly registration_date: Date,
    public readonly first_name?: string,
    public readonly last_name?: string,
    public readonly country_id: string = 'BR',
    public readonly email?: string,
    public readonly identification?: SellerIdentification,
    public readonly address?: SellerAddress,
    public readonly phone?: SellerPhone,
    public readonly alternative_phone?: SellerPhone,
    public readonly user_type: 'normal' | 'company' = 'normal',
    public readonly tags: string[] = [],
    public readonly logo?: string,
    public readonly points: number = 0,
    public readonly site_id: string = 'MLB',
    public readonly permalink: string = '',
    public readonly seller_reputation?: SellerReputation,
    public readonly status?: SellerStatus,
    public readonly secure_email?: string,
    public readonly company_name?: string,
    public readonly logo_version?: number,
    public readonly registration_identifiers: Array<{
      type: string;
      value: string;
    }> = [],
    public readonly required_action?: string,
    public readonly credit?: {
      consumed: number;
      credit_level_id: string;
    }
  ) {
    this.validateSeller();
  }

  /**
   * Business Logic: Validates seller data
   */
  private validateSeller(): void {
    if (!this.id || this.id <= 0) {
      throw new Error('Valid seller ID is required');
    }

    if (!this.nickname || this.nickname.trim() === '') {
      throw new Error('Seller nickname is required');
    }

    if (!this.country_id || this.country_id.trim() === '') {
      throw new Error('Country ID is required');
    }

    if (!this.site_id || this.site_id.trim() === '') {
      throw new Error('Site ID is required');
    }
  }

  /**
   * Business Logic: Get seller's full name
   */
  public getFullName(): string {
    if (this.company_name) {
      return this.company_name;
    }

    if (this.first_name && this.last_name) {
      return `${this.first_name} ${this.last_name}`;
    }

    return this.nickname;
  }

  /**
   * Business Logic: Check if seller is a power seller
   */
  public isPowerSeller(): boolean {
    return !!(this.seller_reputation?.power_seller_status);
  }

  /**
   * Business Logic: Get power seller level
   */
  public getPowerSellerLevel(): string | null {
    return this.seller_reputation?.power_seller_status || null;
  }

  /**
   * Business Logic: Check if seller is active
   */
  public isActive(): boolean {
    return this.status?.site_status === 'active';
  }

  /**
   * Business Logic: Check if seller can sell
   */
  public canSell(): boolean {
    return this.status?.sell?.allow === true;
  }

  /**
   * Business Logic: Check if seller can list items
   */
  public canList(): boolean {
    return this.status?.list?.allow === true;
  }

  /**
   * Business Logic: Get seller reputation score (0-100)
   */
  public getReputationScore(): number {
    if (!this.seller_reputation?.transactions) return 0;

    const { transactions } = this.seller_reputation;
    if (transactions.total === 0) return 0;

    const positiveRate = (transactions.ratings.positive / transactions.total) * 100;
    return Math.round(positiveRate);
  }

  /**
   * Business Logic: Get seller reputation level
   */
  public getReputationLevel(): string {
    const score = this.getReputationScore();
    
    if (score >= 98) return 'Excelente';
    if (score >= 95) return 'Muito Bom';
    if (score >= 90) return 'Bom';
    if (score >= 80) return 'Regular';
    return 'Ruim';
  }

  /**
   * Business Logic: Check if seller has verified phone
   */
  public hasVerifiedPhone(): boolean {
    return this.phone?.verified === true;
  }

  /**
   * Business Logic: Check if seller has confirmed email
   */
  public hasConfirmedEmail(): boolean {
    return this.status?.confirmed_email === true;
  }

  /**
   * Business Logic: Get seller age in days
   */
  public getAgeInDays(): number {
    return Math.floor((Date.now() - this.registration_date.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Business Logic: Check if seller is new (less than 90 days)
   */
  public isNewSeller(): boolean {
    return this.getAgeInDays() < 90;
  }

  /**
   * Business Logic: Get total transactions
   */
  public getTotalTransactions(): number {
    return this.seller_reputation?.transactions?.total || 0;
  }

  /**
   * Business Logic: Get claims rate
   */
  public getClaimsRate(): number {
    return this.seller_reputation?.metrics?.claims?.rate || 0;
  }

  /**
   * Business Logic: Get delayed handling rate
   */
  public getDelayedHandlingRate(): number {
    return this.seller_reputation?.metrics?.delayed_handling_time?.rate || 0;
  }

  /**
   * Business Logic: Check if seller needs attention
   */
  public needsAttention(): boolean {
    // High claims rate
    if (this.getClaimsRate() > 5) return true;

    // High delayed handling rate
    if (this.getDelayedHandlingRate() > 10) return true;

    // Low reputation score
    if (this.getReputationScore() < 90) return true;

    // Cannot sell or list
    if (!this.canSell() || !this.canList()) return true;

    // Account not active
    if (!this.isActive()) return true;

    return false;
  }

  /**
   * Business Logic: Get profile completion percentage
   */
  public getProfileCompletion(): number {
    let completed = 0;
    const total = 10;

    if (this.first_name) completed++;
    if (this.last_name) completed++;
    if (this.email) completed++;
    if (this.hasConfirmedEmail()) completed++;
    if (this.phone) completed++;
    if (this.hasVerifiedPhone()) completed++;
    if (this.address) completed++;
    if (this.identification) completed++;
    if (this.logo) completed++;
    if (this.getTotalTransactions() > 0) completed++;

    return Math.round((completed / total) * 100);
  }

  /**
   * Factory method to create Seller from Mercado Livre API response
   */
  static fromMLResponse(mlSeller: Record<string, unknown>): Seller {
    return new Seller(
      mlSeller.id as number,
      mlSeller.nickname as string,
      mlSeller.registration_date ? new Date(mlSeller.registration_date as string) : new Date(),
      mlSeller.first_name as string,
      mlSeller.last_name as string,
      mlSeller.country_id as string || 'BR',
      mlSeller.email as string,
      mlSeller.identification as SellerIdentification,
      mlSeller.address as SellerAddress,
      mlSeller.phone as SellerPhone,
      mlSeller.alternative_phone as SellerPhone,
      mlSeller.user_type as 'normal' | 'company' || 'normal',
      mlSeller.tags as string[] || [],
      mlSeller.logo as string,
      mlSeller.points as number || 0,
      mlSeller.site_id as string || 'MLB',
      mlSeller.permalink as string || '',
      mlSeller.seller_reputation as SellerReputation,
      mlSeller.status as SellerStatus,
      mlSeller.secure_email as string,
      mlSeller.company_name as string,
      mlSeller.logo_version as number,
      mlSeller.registration_identifiers as Array<{ type: string; value: string }> || [],
      mlSeller.required_action as string,
      mlSeller.credit as { consumed: number; credit_level_id: string }
    );
  }

  /**
   * Convert to summary format for dashboard
   */
  public toSummary(): Record<string, unknown> {
    return {
      id: this.id,
      nickname: this.nickname,
      full_name: this.getFullName(),
      reputation_score: this.getReputationScore(),
      reputation_level: this.getReputationLevel(),
      power_seller_level: this.getPowerSellerLevel(),
      is_active: this.isActive(),
      can_sell: this.canSell(),
      total_transactions: this.getTotalTransactions(),
      profile_completion: this.getProfileCompletion(),
      needs_attention: this.needsAttention(),
      age_in_days: this.getAgeInDays(),
      is_new: this.isNewSeller()
    };
  }
}