CREATE TABLE "article_ticker_sentiments" (
	"id" serial PRIMARY KEY NOT NULL,
	"article_id" integer NOT NULL,
	"ticker_symbol" varchar(10) NOT NULL,
	"relevance_score" numeric(5, 4),
	"ticker_sentiment_score" numeric(5, 4),
	"ticker_sentiment_label" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news_articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"summary" text,
	"banner_image_url" text,
	"source_name" varchar(255),
	"source_domain" varchar(255),
	"published_at" timestamp with time zone NOT NULL,
	"overall_sentiment_score" numeric(5, 4),
	"overall_sentiment_label" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "news_articles_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "stock_prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticker_symbol" varchar(10) NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"open_price" numeric(12, 4),
	"high_price" numeric(12, 4),
	"low_price" numeric(12, 4),
	"close_price" numeric(12, 4),
	"adjusted_close_price" numeric(12, 4),
	"volume" bigint,
	"dividend_amount" numeric(10, 4) DEFAULT '0.0000',
	"split_coefficient" numeric(10, 4) DEFAULT '1.0000',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"ticker_symbol" varchar(10) NOT NULL,
	"risk_appetite" varchar(50) NOT NULL,
	"recommendation_action" varchar(10) NOT NULL,
	"justification_text" text,
	"raw_llm_prompt" text,
	"raw_llm_response" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "article_ticker_sentiments" ADD CONSTRAINT "article_ticker_sentiments_article_id_news_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."news_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "article_ticker_sentiment_idx" ON "article_ticker_sentiments" USING btree ("article_id","ticker_symbol");--> statement-breakpoint
CREATE INDEX "sentiment_ticker_idx" ON "article_ticker_sentiments" USING btree ("ticker_symbol");--> statement-breakpoint
CREATE INDEX "sentiment_article_idx" ON "article_ticker_sentiments" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX "published_at_idx" ON "news_articles" USING btree ("published_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ticker_timestamp_idx" ON "stock_prices" USING btree ("ticker_symbol","timestamp");--> statement-breakpoint
CREATE INDEX "ticker_idx" ON "stock_prices" USING btree ("ticker_symbol");--> statement-breakpoint
CREATE INDEX "recommendation_user_idx" ON "user_recommendations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "recommendation_ticker_idx" ON "user_recommendations" USING btree ("ticker_symbol");