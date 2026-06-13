// DTO types for the economy module (mirrors server/src/routes/shop.ts responses).
export interface PaletteColor { id: string; ru: string; hex: string }

export interface ListingDto {
  kind: 'clothing' | 'furniture' | 'dye' | 'plushie' | 'floor' | 'wallpaper'
  itemId: string
  colorId: string
  ru: string
  colorRu: string
  hex: string
  price: number
  location?: boolean
  sold: boolean
  locked: boolean
  stageLocked: boolean
  stageRu?: string
}

export interface EverydayDto { id: string; ru: string; slot: string; price: number; ownedColors: string[] }
export interface FloorDto { id: string; ru: string; styleRu: string; hex: string; price: number; owned: boolean }
export interface WallpaperDto { id: string; ru: string; hex: string; price: number; owned: boolean }
export interface DyePartDto { id: string; ru: string; price: number; stage: string; stageRu: string; unlocked: boolean }

export interface ShopDto {
  shop: string
  day: string
  stones: number
  plus: boolean
  refreshes: number
  nextRefreshCost: number
  npcGift: number | null
  slots: ListingDto[]
  discount: ListingDto | null
  everyday: EverydayDto[]
  floors: FloorDto[]
  wallpapers: WallpaperDto[]
  dyeParts: DyePartDto[]
  palette: PaletteColor[]
  locationRu: string
}

export interface OwnedItemDto {
  kind: string
  itemId: string
  colorId: string
  ru: string
  slot: string
  price: number
  hex: string
  colorRu: string
}

export interface ComboDto { id: number; name: string; count: number }

export interface EquipEntry { kind: string; itemId: string; colorId: string }

export interface BagDto {
  stones: number
  plus: boolean
  mailUnread: number
  petStage: string
  clothingSlots: { id: string; ru: string }[]
  furnitureSlots: { id: string; ru: string }[]
  dyeParts: DyePartDto[]
  owned: {
    clothing: OwnedItemDto[]
    furniture: OwnedItemDto[]
    floors: OwnedItemDto[]
    wallpapers: OwnedItemDto[]
    dyes: OwnedItemDto[]
  }
  equipped: {
    outfit: Record<string, EquipEntry | undefined>
    room: Record<string, EquipEntry | undefined>
    dyes: Record<string, string | undefined>
  }
  combos: { outfit: ComboDto[]; room: ComboDto[]; color: ComboDto[] }
  comboLimit: number | null
}

export interface CatalogItemDto { id: string; ru: string; price: number; everyday: boolean; ownedColors: string[] }
export interface CatalogDto {
  kind: string
  groups?: { id: string; ru: string; items: CatalogItemDto[] }[]
  parts?: { id: string; ru: string; price: number; stageRu: string; unlocked: boolean; colors: (PaletteColor & { owned: boolean })[] }[]
  palette?: PaletteColor[]
  floors?: FloorDto[]
  wallpapers?: WallpaperDto[]
}

export interface MailItemDto {
  id: number
  kind: string
  title: string
  body: string
  data: Record<string, unknown>
  read: boolean
  ts: number
}

export interface GiftTargetDto { id: number; name: string; owned: boolean; giftedToday: boolean }

export const BOX_COLORS: { id: string; ru: string; hex: string }[] = [
  { id: 'krasny', ru: 'Красная', hex: '#E2574C' },
  { id: 'zelyony', ru: 'Зелёная', hex: '#7FB069' },
  { id: 'goluboy', ru: 'Голубая', hex: '#6FB7E8' },
  { id: 'zolotisty', ru: 'Золотая', hex: '#F2A93B' },
]

export const ERRORS_RU: Record<string, string> = {
  not_enough_stones: 'Не хватает косточек 🦴',
  owned: 'У тебя уже есть эта вещь в этом цвете',
  owned_gift_blocked: 'Эта вещь уже есть у тебя — подарить из витрины нельзя',
  friend_owns: 'У друга уже есть эта вещь',
  already_gifted_today: 'Сегодня ты уже дарил(а) этому другу',
  dyes_not_giftable: 'Краски дарить нельзя',
  stage_locked: 'Эта часть откроется, когда щенок подрастёт',
  plus_required: 'Доступно с подпиской «Дружок Плюс»',
  combo_limit: 'Бесплатно можно сохранить только 2 образа. Больше — с «Дружок Плюс»',
  empty_combo: 'Сначала надень что-нибудь, потом сохраняй образ',
  dye_worn: 'Эту краску щенок сейчас носит — сначала смой её',
  not_owned: 'Этой вещи нет в твоей сумке',
  not_friends: 'Сначала добавь этого друга во Дворике',
  already_claimed: 'Подарок уже открыт',
}

export function errRu(e: unknown): string {
  const code = (e as { data?: { error?: string } })?.data?.error ?? (e as Error)?.message
  return ERRORS_RU[code ?? ''] ?? 'Что-то пошло не так, попробуй ещё раз'
}
