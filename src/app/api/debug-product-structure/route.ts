import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug Product Structure API called');
    
    const cachedProducts = await cache.getAllProducts();
    
    if (cachedProducts && cachedProducts.length > 0) {
      const firstProduct = cachedProducts[0];
      
      // Get all keys
      const allKeys = Object.keys(firstProduct);
      
      // Filter image-related keys
      const imageKeys = allKeys.filter(key => 
        key.includes('picture') || 
        key.includes('thumbnail') || 
        key.includes('image') ||
        key.includes('photo')
      );
      
      // Get sample values for image keys
      const imageData: any = {};
      imageKeys.forEach(key => {
        imageData[key] = (firstProduct as any)[key];
      });
      
      return NextResponse.json({
        success: true,
        product_id: firstProduct.id,
        title: firstProduct.title,
        all_keys: allKeys,
        image_keys: imageKeys,
        image_data: imageData,
        first_product_sample: {
          id: firstProduct.id,
          title: firstProduct.title,
          thumbnail: firstProduct.thumbnail,
          secure_thumbnail: firstProduct.secure_thumbnail,
          pictures: firstProduct.pictures
        }
      });
    }
    
    return NextResponse.json({
      success: false,
      error: "No products in cache"
    });
    
  } catch (error) {
    console.error('Debug Product Structure error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}