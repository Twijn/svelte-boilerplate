CREATE TABLE "activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"ip_address" text,
	"user_agent" text,
	"action" text NOT NULL,
	"category" text NOT NULL,
	"severity" text DEFAULT 'info' NOT NULL,
	"resource_type" text,
	"resource_id" text,
	"metadata" json,
	"message" text,
	"success" boolean DEFAULT true NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"duration" text
);
--> statement-breakpoint
CREATE TABLE "config_variable" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"type" text NOT NULL,
	"category" text NOT NULL,
	"description" text,
	"default_value" text NOT NULL,
	"is_editable" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "email_change_token" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"new_email" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_verification_token" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_token" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permission_node" (
	"id" text PRIMARY KEY NOT NULL,
	"node_type" text NOT NULL,
	"node_path" text NOT NULL,
	"description" text,
	"parent_node_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"permissions" json DEFAULT '[]'::json NOT NULL,
	"is_system_role" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "role_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"avatar" text,
	"bio" text,
	"location" text,
	"website" text,
	"two_factor_secret" text,
	"two_factor_enabled" boolean DEFAULT false NOT NULL,
	"two_factor_backup_codes" json,
	"is_locked" boolean DEFAULT false NOT NULL,
	"locked_at" timestamp with time zone,
	"locked_until" timestamp with time zone,
	"failed_login_attempts" text DEFAULT '0' NOT NULL,
	"last_failed_login" timestamp with time zone,
	"require_password_change" boolean DEFAULT false NOT NULL,
	"is_disabled" boolean DEFAULT false NOT NULL,
	"disabled_at" timestamp with time zone,
	"disabled_by" text,
	"disable_reason" text,
	"email_verified" boolean DEFAULT false NOT NULL,
	"email_verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_username_unique" UNIQUE("username"),
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "user_node_permission" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"node_id" text NOT NULL,
	"permissions" json DEFAULT '[]'::json NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"granted_by" text,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_role" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"role_id" text NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"assigned_by" text
);
--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "config_variable" ADD CONSTRAINT "config_variable_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_change_token" ADD CONSTRAINT "email_change_token_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_verification_token" ADD CONSTRAINT "email_verification_token_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_token" ADD CONSTRAINT "password_reset_token_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_disabled_by_user_id_fk" FOREIGN KEY ("disabled_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_node_permission" ADD CONSTRAINT "user_node_permission_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_node_permission" ADD CONSTRAINT "user_node_permission_node_id_permission_node_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."permission_node"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_node_permission" ADD CONSTRAINT "user_node_permission_granted_by_user_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_role_id_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."role"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_assigned_by_user_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;