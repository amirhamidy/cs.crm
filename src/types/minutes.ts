export type MeetingStatus = "draft" | "pending" | "signed" | "canceled";

export interface MeetingListItem {
  id: number;
  title: string;
  held_at: string;
  location: string;
  status: MeetingStatus;
  created_by: number;
  created_by_username: string;
  signers_count: number;
  signed_count: number;
  created_at: string;
}

export interface SignerItem {
  id: number;
  meeting: number;
  user: number | null;
  username: string | null;
  full_name: string;
  display_name: string;
  phone_number: string;
  is_external: boolean;
  role_title: string;
  order: number;
  is_signed: boolean;
  signed_at: string | null;
  sign_token: string | null;
  signature_image?: string;
  signed_ip?: string | null;
  signed_hash?: string;
}

export interface MeetingDetail {
  id: number;
  title: string;
  held_at: string;
  location: string;
  body: string;
  status: MeetingStatus;
  content_hash: string;
  created_by: number;
  created_by_username: string;
  signers: SignerItem[];
  created_at: string;
  updated_at: string;
}

export interface SignerInput {
  user: number | null;
  full_name: string;
  phone_number: string;
  role_title: string;
  order: number;
}

export interface MeetingCreatePayload {
  title: string;
  held_at: string;
  location: string;
  body: string;
  signers?: SignerInput[];
}

export type MeetingUpdatePayload = Partial<
  Pick<MeetingCreatePayload, "title" | "held_at" | "location" | "body">
>;

export interface SignerCreatePayload extends SignerInput {
  meeting: number;
}

export type SignerUpdatePayload = Partial<
  Pick<SignerInput, "full_name" | "phone_number" | "role_title" | "order">
>;

export interface PublicSigner {
  display_name: string;
  role_title: string;
  is_signed: boolean;
  signed_at: string | null;
  meeting: Pick<MeetingDetail, "id" | "title" | "held_at" | "location" | "body" | "status">;
  participants: Array<{
    display_name: string;
    role_title: string;
    is_signed: boolean;
  }>;
}

/** گزینه‌ی کاربر داخلی برای انتخاب به‌عنوان امضاکننده */
export interface UserOption {
  id: number; // شناسه‌ی User (همان مقداری که در فیلد signer.user ارسال می‌شود)
  username: string;
  label: string;
  phone: string | null;
}
