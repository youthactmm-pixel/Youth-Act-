let pendingRequests = 0
const listeners = new Set<() => void>()

// Backend ခေါ်ဆိုမှုများ စတင်/ပြီးဆုံးချိန်တွင် loading UI ကို အသိပေးရန် listener များမှတ်ပုံတင်သည်။
export function subscribeToBackendLoading(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getBackendLoadingSnapshot(): boolean {
  return pendingRequests > 0
}

// Request တစ်ခုထက်ပိုတစ်ပြိုင်နက်လုပ်နေချိန်တွင်လည်း UI state မှန်စေရန် counter ပြောင်းတိုင်း အသိပေးသည်။
function notifyListeners(): void {
  for (const listener of listeners) {
    listener()
  }
}

// API service များက request ကို ဒီ wrapper ဖြင့်ခေါ်၍ loading ကို အောင်မြင်/အမှား နှစ်မျိုးလုံးတွင် ပိတ်သည်။
export async function withBackendLoading<T>(
  request: () => Promise<T>
): Promise<T> {
  pendingRequests += 1
  notifyListeners()

  try {
    return await request()
  } finally {
    pendingRequests -= 1
    notifyListeners()
  }
}
