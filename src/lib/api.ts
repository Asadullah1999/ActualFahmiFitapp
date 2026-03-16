const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://fahmifit.com';

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export interface AIChatResponse {
  message: string;
  suggestions?: string[];
}

export async function chatWithAI(
  messages: { role: string; content: string }[],
  userContext?: Record<string, unknown>
): Promise<AIChatResponse> {
  return request<AIChatResponse>('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ messages, userContext }),
  });
}

export interface MealAnalysisResponse {
  foods: {
    name: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g?: number;
    serving_size?: string;
    confidence?: number;
  }[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  notes?: string;
}

export async function analyzeMeal(
  base64Image: string,
  mimeType = 'image/jpeg'
): Promise<MealAnalysisResponse> {
  return request<MealAnalysisResponse>('/api/ai/analyze-meal', {
    method: 'POST',
    body: JSON.stringify({ image: base64Image, mimeType }),
  });
}

export interface GroceryListResponse {
  items: {
    category: string;
    name: string;
    quantity?: string;
  }[];
}

export async function generateGroceryList(
  goal: string,
  dietPreference: string,
  dailyCalories: number
): Promise<GroceryListResponse> {
  return request<GroceryListResponse>('/api/ai/grocery-list', {
    method: 'POST',
    body: JSON.stringify({ goal, dietPreference, dailyCalories }),
  });
}

export interface BarcodeProduct {
  name: string;
  brand?: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
  serving_size?: string;
  image_url?: string;
}

export async function lookupBarcode(
  barcode: string
): Promise<BarcodeProduct | null> {
  try {
    return await request<BarcodeProduct>(
      `/api/barcode/lookup?barcode=${encodeURIComponent(barcode)}`
    );
  } catch {
    return null;
  }
}

export interface WhatsAppVerificationResponse {
  success: boolean;
  message?: string;
}

export async function sendWhatsAppVerification(
  phoneNumber: string
): Promise<WhatsAppVerificationResponse> {
  return request<WhatsAppVerificationResponse>(
    '/api/whatsapp/send-verification',
    {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    }
  );
}

export interface StripeCheckoutResponse {
  checkoutUrl: string;
  sessionId: string;
}

export async function createStripeCheckout(
  plan: string,
  userId: string,
  email: string
): Promise<StripeCheckoutResponse> {
  return request<StripeCheckoutResponse>('/api/stripe/checkout', {
    method: 'POST',
    body: JSON.stringify({ plan, userId, email }),
  });
}
