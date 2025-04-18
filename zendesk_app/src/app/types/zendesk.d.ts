export type ZendeskTask = 'iterate' | 'reformulate' | 'generate' | 'correct' | 'summarize' | 'translate'

export interface TicketIngestionProgress {
  total_tickets: number
  processed_tickets: number
  status: 'RUNNING' | 'COMPLETED' | string
}
export interface ZendeskConnection {
  id: string;
  email: string;
  subdomain: string;
  api_key: string;
  user_id: string;
  time_range: number;
  triggers_id?: string[];
  webhook_id?: string;
  brain_links: ZendeskBrain[];
  external_endpoints: ExternalAPIEndpoint[];
  display_generate_button: boolean;
  display_iterate_button: boolean;
  display_reformulate_button: boolean;
  display_correct_button: boolean;
  display_summarize_button: boolean;
  display_translate_button: boolean;
}

export interface ZendeskBrain {
  brain?: string;
  zendesk?: string;
  auto_draft_back: boolean;
  auto_draft_front: boolean;
}

export interface ExternalAPIEndpoint {
  id: string;
  name: string;
  provider_type: string;
  environment: string;
  description: string;
  url: string;
  method: string;
  enabled: boolean;
  headers: Record<string, string>;
  params: Record<string, string>;
}

interface ZendeskTimeZone {
  name: string;
  translatedName: string;
  ianaName: string;
  offset: number;
  formattedOffset: string;
}

interface ZendeskGroup {
  id: number;
  name: string;
}

interface ZendeskOrganization {
  group: ZendeskGroup | null;
  domains: string;
  id: number;
  name: string;
  sharedComments: boolean;
  sharedTickets: boolean;
}

interface ZendeskIdentity {
  id: number; 
  type: 'email' | 'twitter' | 'facebook' | 'google' | 'agent_forwarding' | 'phone_number';
  value: string; 
  verified: boolean; 
  primary: boolean; 
  userId: number; 
  undeliverableCount?: number; 
  deliverableState?: 'deliverable' | 'undeliverable'; 
}

export interface ZendeskUser {
  alias: string;
  avatarUrl: string;
  details: string;
  email: string;
  externalId: string | null;
  id: number;
  identities: ZendeskIdentity[];
  isSystemUser: boolean;
  locale: string;
  name: string;
  notes: string;
  role: 'end-user' | 'agent' | 'admin' | number;
  signature: string;
  tags: string[];
  timeZone: ZendeskTimeZone;
  groups: ZendeskGroup[];
  organizations: ZendeskOrganization[];
}
