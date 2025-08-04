CREATE TABLE "users" (
	"email" varchar(255) NOT NULL,
	"username" varchar(255) NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
