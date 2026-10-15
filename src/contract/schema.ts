/**
 * GENERATED FILE - DO NOT EDIT.
 * Regenerate with `npm run contract:generate`.
 *
 * Source:    https://github.com/House-Hold-Hub/Documentation/blob/e4199c51e11508458dfe15949e2b5672af70780f/api/openapi.yaml
 * Revision:  e4199c51e11508458dfe15949e2b5672af70780f
 * Spec SHA-256: c61de7b6c7087a7da369ea86ddc904017e88f0c0a05f40dbbaf5cf9f8d1aa004
 * Generator: openapi-typescript@7.13.0
 */

export interface paths {
    "/auth/csrf": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Bootstrap same-origin CSRF protection
         * @description Creates or refreshes the CSRF cookie and returns a token for the
         *     X-CSRFToken header. The response must not be cached.
         */
        get: operations["getCsrfToken"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/signup": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Create an email/password account
         * @description Creates a UUID user, a restricted pre-verification session, and a durable
         *     email-verification delivery record. Email sending is attempted synchronously
         *     after commit; the account remains created if delivery fails. The session key
         *     rotates while preserving a same-browser pending invitation intent.
         */
        post: operations["signup"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Authenticate with email and password
         * @description Rotates the session key. A valid but unverified account receives a restricted
         *     session and email_verification_required=true; that session cannot access
         *     household data. Same-browser pending invitation intent is preserved.
         */
        post: operations["login"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Revoke the current session
         * @description Flushes the current session, including any pending invitation intent.
         */
        post: operations["logout"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get the current session user */
        get: operations["getCurrentUser"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/email/verify": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Verify an initial account email with a one-time bearer
         * @description The frontend reads the bearer from a URI fragment, immediately removes the
         *     fragment from browser history, and sends the bearer only in this body. This
         *     public operation accepts only initial-account verification bearers. Success
         *     marks the account email verified. If the same browser already has the matching
         *     restricted pre-verification session, the backend may upgrade and rotate that
         *     existing session, preserving its valid pending invitation intent. Otherwise the
         *     bearer does not create or authenticate a session and the user must log in normally.
         */
        post: operations["verifyEmail"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/email/resend-verification": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Resend verification for the current unverified account
         * @description Creates a durable delivery attempt and synchronously attempts sending after
         *     commit. The response reports delivery state without rolling back account state.
         */
        post: operations["resendEmailVerification"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/email/change": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Start a verified primary-email change
         * @description Requires a recently reauthenticated current session, with the exact recency
         *     window supplied by security configuration. Creates a pending change and durable
         *     verification-delivery record for new_email, then synchronously attempts provider
         *     submission after commit. The current primary address remains in effect until the
         *     new address completes the authenticated primary-email verification operation.
         */
        post: operations["requestPrimaryEmailChange"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/email/change/verify": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Verify and establish a pending primary-email change
         * @description Requires the same recently reauthenticated current session used for the pending
         *     primary-email change, with the exact recency window supplied by security
         *     configuration. Atomically consumes the pending-change verifier, establishes the
         *     verified new primary address, rotates the current session, and revokes every
         *     other session for the user. The bearer cannot independently establish a session
         *     or log a user in.
         */
        post: operations["verifyPrimaryEmailChange"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/forgot-password": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Request a password-reset email
         * @description Always returns the same acknowledgement for syntactically valid input, whether
         *     or not the account exists. The reset bearer is delivered in a frontend URI
         *     fragment and is never placed in an API path or query string.
         */
        post: operations["requestPasswordReset"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/reset-password": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Set a new password using a one-time bearer
         * @description Validates and consumes the bearer atomically, changes the password, and revokes
         *     every user session. The user must log in again.
         */
        post: operations["resetPassword"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/change-password": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Change the current account password
         * @description Verifies the current password, applies the new password, revokes every other
         *     session for the user, and rotates the current session. A valid same-browser
         *     pending invitation intent survives the current-session rotation.
         */
        post: operations["changePassword"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/google": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Start Google OAuth login
         * @description Browser navigation that establishes a state-bound OAuth attempt. OAuth state is
         *     mandatory and is validated at callback. The flow must not auto-link a Google
         *     identity to an existing account merely because email addresses match.
         */
        get: operations["startGoogleLogin"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/google/callback": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Complete Google OAuth login or explicit link
         * @description Validates code and mandatory state. Login creates or authenticates a Google-backed
         *     account only when safe. If the provider email belongs to an unlinked existing
         *     account, the operation returns 409 and requires the authenticated explicit-link
         *     flow. Successful login/link rotates the session while preserving a valid
         *     same-browser pending invitation intent; successful link also revokes other
         *     sessions for the user.
         */
        get: operations["completeGoogleOAuth"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/google/link/start": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Start explicit Google linking for the current account
         * @description Requires a recently reauthenticated current session, with the exact recency
         *     window supplied by security configuration. Creates a state-bound link attempt
         *     for that authenticated user. Completion uses the shared callback and must link
         *     only to the same user.
         */
        post: operations["startGoogleLink"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/google/link": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Remove Google from the current account
         * @description Requires a recently reauthenticated current session, with the exact recency
         *     window supplied by security configuration. Successful unlink revokes all other
         *     sessions and rotates the current session.
         */
        delete: operations["unlinkGoogle"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/households": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List households for the verified current user */
        get: operations["listHouseholds"];
        put?: never;
        /**
         * Create a household
         * @description The verified current user becomes Owner. currency_code is required and immutable
         *     for the MVP. The backend validates its supported ISO minor-unit semantics.
         */
        post: operations["createHousehold"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/households/{household_id}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                household_id: components["parameters"]["HouseholdId"];
            };
            cookie?: never;
        };
        /** Get household details */
        get: operations["getHousehold"];
        put?: never;
        post?: never;
        /**
         * Soft-delete a household as Owner
         * @description Immediately removes member access while preserving household data for the
         *     approved 30-day support/admin recovery window. No self-service recovery
         *     operation is exposed by the MVP API.
         */
        delete: operations["deleteHousehold"];
        options?: never;
        head?: never;
        /**
         * Update household settings as Owner
         * @description currency_code is immutable and is not accepted by this operation.
         */
        patch: operations["updateHousehold"];
        trace?: never;
    };
    "/households/{household_id}/code": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                household_id: components["parameters"]["HouseholdId"];
            };
            cookie?: never;
        };
        /** Get the current household join code as Owner */
        get: operations["getHouseholdCode"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/households/{household_id}/code/regenerate": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                household_id: components["parameters"]["HouseholdId"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Regenerate the join code as Owner
         * @description Atomically invalidates the previous code.
         */
        post: operations["regenerateHouseholdCode"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/households/join": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Join a household using its current code
         * @description The verified authenticated user supplies the code in the request body. Codes are
         *     never accepted in paths/query strings and are not logged.
         */
        post: operations["joinHouseholdByCode"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/households/{household_id}/members": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                household_id: components["parameters"]["HouseholdId"];
            };
            cookie?: never;
        };
        /** List active household members */
        get: operations["listHouseholdMembers"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/households/{household_id}/members/{user_id}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                household_id: components["parameters"]["HouseholdId"];
                user_id: components["parameters"]["UserId"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Remove a member as Owner
         * @description Access is denied on the removed user's next request. Their content remains.
         *     Tasks currently assigned to them become unassigned and expose null current
         *     assignee fields; the MVP exposes no former-assignee history.
         */
        delete: operations["removeHouseholdMember"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/households/{household_id}/invitations": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                household_id: components["parameters"]["HouseholdId"];
            };
            cookie?: never;
        };
        /** List invitations as Owner */
        get: operations["listHouseholdInvitations"];
        put?: never;
        /**
         * Invite a member by email as Owner
         * @description Creates an invitation and durable email-delivery record in one transaction.
         *     Email sending is attempted synchronously after commit. Delivery failure does not
         *     roll back the invitation and is reported by delivery.status. The raw verifier is
         *     sent only in the email's frontend URI fragment and is never returned here.
         *     expires_at is set 30 days after issuance and is not client-settable; revoke,
         *     resend, or acceptance may make the invitation unusable earlier.
         */
        post: operations["createHouseholdInvitation"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/households/{household_id}/invitations/{invitation_id}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                household_id: components["parameters"]["HouseholdId"];
                invitation_id: components["parameters"]["InvitationId"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Revoke an invitation by ID as Owner
         * @description Revocation invalidates the invitation and every session-bound pending intent.
         *     Any verifier rotation or reissue likewise changes the server-side generation so
         *     an intent exchanged under an older generation cannot be accepted.
         */
        delete: operations["revokeHouseholdInvitation"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/households/{household_id}/invitations/{invitation_id}/resend": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                household_id: components["parameters"]["HouseholdId"];
                invitation_id: components["parameters"]["InvitationId"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Rotate and resend a pending invitation as Owner
         * @description Atomically rotates the single-use verifier generation, invalidates every stale
         *     session intent, retains the recoverable invitation record, resets expires_at to
         *     30 days after reissuance, creates a durable delivery record, and synchronously
         *     attempts provider submission after commit.
         */
        post: operations["resendHouseholdInvitation"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/invitations/exchange": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Exchange a fragment bearer for a session-bound pending intent
         * @description The frontend reads the high-entropy verifier from the URI fragment, removes it
         *     immediately, and sends it only in this body. The backend hashes and validates the
         *     current verifier and atomically redeems that verifier for exchange, so a second
         *     exchange attempt with it fails. The Invitation itself remains pending for later
         *     explicit acceptance. The backend stores only a non-secret invitation ID and
         *     verifier generation in the server-side session. This operation discloses no
         *     household preview. The intent remains local to this browser session and is not
         *     copied to the user's global account.
         */
        post: operations["exchangeInvitationVerifier"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/invitations/pending": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Preview the current session's pending invitation
         * @description Returns a safe preview only when the authenticated user's normalized email is
         *     verified and exactly matches the invitation email. State, expiry, household,
         *     nonmembership, and stored verifier generation are revalidated.
         */
        get: operations["previewPendingInvitation"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/invitations/pending/accept": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Accept the current session's pending invitation
         * @description In one atomic operation, revalidates the session-bound ID and verifier generation,
         *     pending state, expiry, active household, absence of duplicate membership, and the
         *     authenticated verified normalized-email match; then creates membership, consumes
         *     the invitation, and clears the pending intent.
         */
        post: operations["acceptPendingInvitation"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/households/{household_id}/tasks": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                household_id: components["parameters"]["HouseholdId"];
            };
            cookie?: never;
        };
        /** List household tasks */
        get: operations["listTasks"];
        put?: never;
        /**
         * Create a task
         * @description Any active member may create a task and optionally assign it to one active
         *     member of the same household. A task may also be unassigned.
         */
        post: operations["createTask"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/households/{household_id}/tasks/{task_id}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                household_id: components["parameters"]["HouseholdId"];
                task_id: components["parameters"]["TaskId"];
            };
            cookie?: never;
        };
        /** Get task details */
        get: operations["getTask"];
        put?: never;
        post?: never;
        /** Permanently delete a task as creator or Owner */
        delete: operations["deleteTask"];
        options?: never;
        head?: never;
        /**
         * Update task details
         * @description Any active member may change ordinary details. Only the task creator or
         *     Household Owner may change or clear assigned_to_membership_id. Writes are last-write-wins;
         *     no version precondition or concurrent-edit 409 is used.
         */
        patch: operations["updateTask"];
        trace?: never;
    };
    "/households/{household_id}/tasks/{task_id}/complete": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                household_id: components["parameters"]["HouseholdId"];
                task_id: components["parameters"]["TaskId"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Complete or reopen a task
         * @description If assigned, only the current assignee or Household Owner may change completion.
         *     If unassigned, any active member may do so. The rule applies symmetrically to
         *     completing and reopening. The backend sets or clears completed_by/completed_at.
         */
        patch: operations["setTaskCompletion"];
        trace?: never;
    };
    "/households/{household_id}/shopping": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                household_id: components["parameters"]["HouseholdId"];
            };
            cookie?: never;
        };
        /** List shopping items */
        get: operations["listShoppingItems"];
        put?: never;
        /**
         * Add a shopping item
         * @description Any active household member may add an item.
         */
        post: operations["createShoppingItem"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/households/{household_id}/shopping/{item_id}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                household_id: components["parameters"]["HouseholdId"];
                item_id: components["parameters"]["ShoppingItemId"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Permanently delete a shopping item as creator or Owner */
        delete: operations["deleteShoppingItem"];
        options?: never;
        head?: never;
        /**
         * Update or toggle a shopping item
         * @description Any active member may update details or purchased state. A false-to-true
         *     transition records the current user and time; true-to-false clears them.
         */
        patch: operations["updateShoppingItem"];
        trace?: never;
    };
    "/households/{household_id}/shopping/purchased": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                household_id: components["parameters"]["HouseholdId"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Permanently clear all purchased items
         * @description Any active member may bulk-delete every purchased item after frontend
         *     confirmation. This is permanent deletion, not archival.
         */
        delete: operations["clearPurchasedShoppingItems"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/households/{household_id}/expenses": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                household_id: components["parameters"]["HouseholdId"];
            };
            cookie?: never;
        };
        /**
         * List and aggregate household expenses
         * @description Results sort by incurred_on descending, then created_at descending, then id
         *     descending. Aggregates cover all filtered rows, not only the returned page, and
         *     are always expressed in the household's single immutable currency.
         */
        get: operations["listExpenses"];
        put?: never;
        /**
         * Log an expense
         * @description Any active member may create an expense. If payer_id is omitted or null, it
         *     defaults to the creator. The backend copies the household currency code into an
         *     immutable expense snapshot. No FX conversion is performed.
         */
        post: operations["createExpense"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/households/{household_id}/expenses/{expense_id}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                household_id: components["parameters"]["HouseholdId"];
                expense_id: components["parameters"]["ExpenseId"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Permanently delete an expense as creator or Owner */
        delete: operations["deleteExpense"];
        options?: never;
        head?: never;
        /**
         * Update an expense as creator or Owner
         * @description payer_id and currency_code are immutable. Other accepted fields use
         *     last-write-wins.
         */
        patch: operations["updateExpense"];
        trace?: never;
    };
    "/households/{household_id}/inventory": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                household_id: components["parameters"]["HouseholdId"];
            };
            cookie?: never;
        };
        /** List household inventory items */
        get: operations["listInventoryItems"];
        put?: never;
        /**
         * Add an inventory item
         * @description Any active household member may add an item with positive integer quantity.
         */
        post: operations["createInventoryItem"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/households/{household_id}/inventory/{item_id}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                household_id: components["parameters"]["HouseholdId"];
                item_id: components["parameters"]["InventoryItemId"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Permanently delete an inventory item as creator or Owner */
        delete: operations["deleteInventoryItem"];
        options?: never;
        head?: never;
        /**
         * Update an inventory item
         * @description Any active household member may update details and positive quantity.
         */
        patch: operations["updateInventoryItem"];
        trace?: never;
    };
    "/households/{household_id}/dashboard": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                household_id: components["parameters"]["HouseholdId"];
            };
            cookie?: never;
        };
        /**
         * Get the minimal household dashboard
         * @description The official frontend supplies its browser-local calendar date as as_of. The
         *     backend neither substitutes its UTC date nor persists a user/household timezone.
         *     as_of is a projection anchor, not a historical-dashboard product feature. The
         *     response is private and not cacheable by shared or persistent HTTP caches.
         */
        get: operations["getHouseholdDashboard"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        ErrorResponse: {
            /** @enum {string} */
            code: "VALIDATION_ERROR" | "AUTHENTICATION_ERROR" | "AUTHORIZATION_ERROR" | "NOT_FOUND" | "CONFLICT" | "RATE_LIMITED" | "INTERNAL_ERROR";
            message: string;
            fields?: {
                [key: string]: string[];
            } | null;
        };
        AcknowledgementResponse: {
            message: string;
        };
        CsrfResponse: {
            /** @description Non-secret CSRF token to echo in the X-CSRFToken header. */
            csrf_token: string;
        };
        PageMeta: {
            page: number;
            limit: number;
            total: number;
        };
        /**
         * @description ISO 4217 currency code supported by the backend and having a defined numeric
         *     minor-unit exponent. No currency conversion is performed.
         * @example EUR
         */
        CurrencyCode: string;
        EmailDeliverySummary: {
            /** Format: uuid */
            id: string;
            /** @enum {string} */
            purpose: "email_verification" | "password_reset" | "household_invitation";
            /**
             * @description provider_accepted means the configured provider accepted the message; it
             *     does not assert inbox delivery. unknown covers an ambiguous provider result.
             * @enum {string}
             */
            status: "pending" | "provider_accepted" | "failed" | "unknown";
            /** Format: date-time */
            created_at: string;
            /** Format: date-time */
            last_attempt_at: string | null;
            /** Format: date-time */
            provider_accepted_at: string | null;
        };
        UserSummary: {
            /** Format: uuid */
            id: string;
            /** Format: email */
            email: string;
            name: string;
            email_verified: boolean;
        };
        UserResponse: {
            /** Format: uuid */
            id: string;
            /** Format: email */
            email: string;
            name: string;
            email_verified: boolean;
            google_linked: boolean;
            /** Format: date-time */
            created_at: string;
        };
        SignupRequest: {
            /** Format: email */
            email: string;
            /** Format: password */
            password: string;
            name: string;
        };
        SignupResponse: {
            user: components["schemas"]["UserResponse"];
            /** @enum {boolean} */
            email_verification_required: true;
            delivery: components["schemas"]["EmailDeliverySummary"];
        };
        LoginRequest: {
            /** Format: email */
            email: string;
            /** Format: password */
            password: string;
        };
        LoginResponse: {
            user: components["schemas"]["UserResponse"];
            /**
             * @description True for a restricted session that may verify/resend email but cannot
             *     access household data.
             */
            email_verification_required: boolean;
        };
        EmailVerificationRequest: {
            /**
             * Format: password
             * @description One-time bearer extracted from the frontend URL fragment, removed from
             *     browser history, and sent only in this request body.
             */
            verifier: string;
        };
        PrimaryEmailChangeRequest: {
            /** Format: email */
            new_email: string;
        };
        ResendVerificationResponse: {
            delivery: components["schemas"]["EmailDeliverySummary"];
        };
        PasswordResetRequest: {
            /** Format: email */
            email: string;
        };
        PasswordResetConfirmRequest: {
            /**
             * Format: password
             * @description One-time reset bearer supplied in the request body, never a path/query value.
             */
            verifier: string;
            /** Format: password */
            new_password: string;
        };
        PasswordChangeRequest: {
            /** Format: password */
            current_password: string;
            /** Format: password */
            new_password: string;
        };
        OAuthLinkStartResponse: {
            /** Format: uri */
            authorization_url: string;
        };
        HouseholdSummary: {
            /** Format: uuid */
            id: string;
            name: string;
            description: string | null;
            /** Format: uuid */
            owner_id: string;
            currency_code: components["schemas"]["CurrencyCode"];
        };
        HouseholdResponse: components["schemas"]["HouseholdSummary"] & {
            /** Format: date-time */
            created_at: string;
            /** Format: date-time */
            updated_at: string;
        };
        HouseholdCreateRequest: {
            name: string;
            description?: string | null;
            currency_code: components["schemas"]["CurrencyCode"];
        };
        /** @description currency_code is immutable in the MVP and cannot be updated. */
        HouseholdUpdateRequest: {
            name?: string;
            description?: string | null;
        };
        HouseholdListResponse: {
            data: components["schemas"]["HouseholdSummary"][];
            meta: components["schemas"]["PageMeta"];
        };
        HouseholdCodeResponse: {
            /** @description Current globally unique eight-character join code. Never place it in logs or URLs. */
            code: string;
        };
        HouseholdJoinRequest: {
            code: string;
        };
        MembershipSummary: {
            /** Format: uuid */
            id: string;
            /** Format: uuid */
            user_id: string;
            user_name: string;
            /** @enum {string} */
            role: "owner" | "member";
            /** Format: date-time */
            joined_at: string;
        };
        MembershipListResponse: {
            data: components["schemas"]["MembershipSummary"][];
        };
        InvitationCreateRequest: {
            /** Format: email */
            email: string;
        };
        InvitationOwnerResponse: {
            /** Format: uuid */
            id: string;
            /** Format: uuid */
            household_id: string;
            /** Format: email */
            email: string;
            /** @enum {string} */
            state: "pending" | "accepted" | "revoked" | "expired";
            /** Format: date-time */
            created_at: string;
            /**
             * Format: date-time
             * @description Exactly 30 days after the current issuance or resend, unless the
             *     invitation is accepted, revoked, rotated, or otherwise invalidated earlier.
             */
            expires_at: string;
            /** Format: date-time */
            accepted_at: string | null;
        };
        InvitationDeliveryResponse: {
            invitation: components["schemas"]["InvitationOwnerResponse"];
            delivery: components["schemas"]["EmailDeliverySummary"];
        };
        InvitationListResponse: {
            data: components["schemas"]["InvitationOwnerResponse"][];
        };
        InvitationExchangeRequest: {
            /**
             * Format: password
             * @description High-entropy bearer extracted from the frontend URI fragment. It must
             *     never be persisted by the browser or sent in a path/query value.
             */
            verifier: string;
        };
        InvitationPreviewResponse: {
            /** Format: uuid */
            invitation_id: string;
            household: components["schemas"]["HouseholdSummary"];
            /** Format: email */
            invited_email: string;
            /** Format: date-time */
            expires_at: string;
        };
        InvitationAcceptResponse: {
            household: components["schemas"]["HouseholdSummary"];
            membership: components["schemas"]["MembershipSummary"];
        };
        TaskSummary: {
            /** Format: uuid */
            id: string;
            /** Format: uuid */
            household_id: string;
            title: string;
            /** Format: date */
            due_date: string | null;
            /**
             * Format: uuid
             * @description Current assignee Membership ID; null when unassigned or after assignee removal.
             */
            assigned_to_membership_id: string | null;
            /** @description Current assignee display name; null when unassigned. No former-assignee history is exposed. */
            assigned_to_name: string | null;
            completed: boolean;
            /** Format: uuid */
            completed_by_id: string | null;
            /** Format: date-time */
            completed_at: string | null;
            /** Format: uuid */
            created_by_id: string | null;
            created_by_name: string | null;
            /** Format: date-time */
            created_at: string;
            /** Format: date-time */
            updated_at: string;
        };
        TaskResponse: components["schemas"]["TaskSummary"] & {
            description: string | null;
        };
        TaskCreateRequest: {
            title: string;
            description?: string | null;
            /** Format: date */
            due_date?: string | null;
            /**
             * Format: uuid
             * @description Must identify an active member of this household.
             */
            assigned_to_membership_id?: string | null;
        };
        TaskUpdateRequest: {
            title?: string;
            description?: string | null;
            /** Format: date */
            due_date?: string | null;
            /**
             * Format: uuid
             * @description Only the task creator or Household Owner may change this field.
             */
            assigned_to_membership_id?: string | null;
        };
        TaskCompletionRequest: {
            completed: boolean;
        };
        TaskListResponse: {
            data: components["schemas"]["TaskSummary"][];
            meta: components["schemas"]["PageMeta"];
        };
        ShoppingItemSummary: {
            /** Format: uuid */
            id: string;
            /** Format: uuid */
            household_id: string;
            name: string;
            quantity: string | null;
            purchased: boolean;
            /** Format: uuid */
            purchased_by_id: string | null;
            purchased_by_name: string | null;
            /** Format: date-time */
            purchased_at: string | null;
            /** Format: uuid */
            created_by_id: string | null;
            created_by_name: string | null;
            /** Format: date-time */
            created_at: string;
            /** Format: date-time */
            updated_at: string;
        };
        ShoppingItemResponse: components["schemas"]["ShoppingItemSummary"];
        ShoppingItemCreateRequest: {
            name: string;
            quantity?: string | null;
        };
        ShoppingItemUpdateRequest: {
            name?: string;
            quantity?: string | null;
            /** @description Backend records or clears purchaser and purchase time with this transition. */
            purchased?: boolean;
        };
        ShoppingItemListResponse: {
            data: components["schemas"]["ShoppingItemSummary"][];
            meta: components["schemas"]["PageMeta"];
        };
        BulkDeleteResponse: {
            deleted_count: number;
        };
        /** @enum {string} */
        ExpenseCategory: "Food" | "Utilities" | "Maintenance" | "Entertainment" | "Other";
        ExpenseSummary: {
            /** Format: uuid */
            id: string;
            /** Format: uuid */
            household_id: string;
            /** @description Positive amount in the ISO 4217 minor units applicable to currency_code. */
            amount_minor: number;
            currency_code: components["schemas"]["CurrencyCode"];
            category: components["schemas"]["ExpenseCategory"];
            /**
             * Format: date
             * @description Calendar date explicitly supplied by the client at creation.
             */
            incurred_on: string;
            /** Format: uuid */
            payer_id: string | null;
            payer_name: string | null;
            description: string | null;
            /** Format: uuid */
            created_by_id: string | null;
            created_by_name: string | null;
            /** Format: date-time */
            created_at: string;
            /** Format: date-time */
            updated_at: string;
        };
        ExpenseResponse: components["schemas"]["ExpenseSummary"];
        /**
         * @description currency_code is not client-settable. The backend copies the household's
         *     immutable currency code into the expense snapshot.
         */
        ExpenseCreateRequest: {
            amount_minor: number;
            category: components["schemas"]["ExpenseCategory"];
            /**
             * Format: date
             * @description Required client-supplied calendar date. The official frontend defaults
             *     it from the browser-local date; the backend never derives it from UTC.
             */
            incurred_on: string;
            /**
             * Format: uuid
             * @description Active household member; omitted or null defaults to the creator.
             */
            payer_id?: string | null;
            description?: string | null;
        };
        /** @description payer_id and currency fields are immutable and cannot be updated. */
        ExpenseUpdateRequest: {
            amount_minor?: number;
            category?: components["schemas"]["ExpenseCategory"];
            /** Format: date */
            incurred_on?: string;
            description?: string | null;
        };
        ExpenseCategoryTotals: {
            Food: number;
            Utilities: number;
            Maintenance: number;
            Entertainment: number;
            Other: number;
        };
        ExpenseListMeta: {
            page: number;
            limit: number;
            total: number;
            /** @description Sum across all expenses matching the current filters, not only this page. */
            total_amount_minor: number;
            currency_code: components["schemas"]["CurrencyCode"];
            by_category: components["schemas"]["ExpenseCategoryTotals"];
        };
        ExpenseListResponse: {
            data: components["schemas"]["ExpenseSummary"][];
            meta: components["schemas"]["ExpenseListMeta"];
        };
        InventoryItemSummary: {
            /** Format: uuid */
            id: string;
            /** Format: uuid */
            household_id: string;
            name: string;
            quantity: number;
            unit: string | null;
            category: string | null;
            location: string | null;
            /** Format: uuid */
            created_by_id: string | null;
            created_by_name: string | null;
            /** Format: date-time */
            created_at: string;
            /** Format: date-time */
            updated_at: string;
        };
        InventoryItemResponse: components["schemas"]["InventoryItemSummary"];
        InventoryItemCreateRequest: {
            name: string;
            quantity: number;
            unit?: string | null;
            category?: string | null;
            location?: string | null;
        };
        InventoryItemUpdateRequest: {
            name?: string;
            quantity?: number;
            unit?: string | null;
            category?: string | null;
            location?: string | null;
        };
        InventoryItemListResponse: {
            data: components["schemas"]["InventoryItemSummary"][];
            meta: components["schemas"]["PageMeta"];
        };
        DashboardResponse: {
            /** Format: date */
            as_of: string;
            household: components["schemas"]["HouseholdSummary"];
            member_count: number;
            members: components["schemas"]["MembershipSummary"][];
            /** @description Count of every incomplete task, including tasks without a due date. */
            pending_task_count: number;
            /**
             * @description At most three incomplete dated tasks. Eligible tasks are overdue
             *     (due_date < as_of), due today, or upcoming through as_of + 7 days
             *     inclusive. Undated tasks are excluded. Ordering is due_date ascending,
             *     then created_at ascending, then id ascending.
             */
            due_tasks: components["schemas"]["TaskSummary"][];
            shopping_pending_count: number;
        };
    };
    responses: {
        /** @description Malformed request or request/domain validation failure. */
        BadRequest: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
        /** @description A valid authenticated session is required. */
        Unauthorized: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
        /** @description The caller can access the addressed resource but may not perform this action. */
        Forbidden: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
        /** @description The resource does not exist or is outside the caller's household scope. */
        NotFound: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
        /** @description Duplicate resource or invalid current lifecycle state. */
        Conflict: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
        /** @description Request throttled under the configured security policy. */
        TooManyRequests: {
            headers: {
                /** @description When present, seconds until the caller should retry. */
                "Retry-After"?: number;
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ErrorResponse"];
            };
        };
    };
    parameters: {
        /** @description Token returned by the same-origin CSRF bootstrap operation. */
        CsrfToken: string;
        HouseholdId: string;
        UserId: string;
        InvitationId: string;
        TaskId: string;
        ShoppingItemId: string;
        ExpenseId: string;
        InventoryItemId: string;
        Page: number;
        Limit: number;
    };
    requestBodies: never;
    headers: {
        /** @description Authenticated and security-sensitive responses are not shared-cacheable. */
        NoStore: string;
    };
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    getCsrfToken: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description CSRF token issued. */
            200: {
                headers: {
                    /** @description Same-origin CSRF cookie. */
                    "Set-Cookie"?: string;
                    "Cache-Control": components["headers"]["NoStore"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CsrfResponse"];
                };
            };
        };
    };
    signup: {
        parameters: {
            query?: never;
            header: {
                /** @description Token returned by the same-origin CSRF bootstrap operation. */
                "X-CSRFToken": components["parameters"]["CsrfToken"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SignupRequest"];
            };
        };
        responses: {
            /** @description Account created; email verification is required before household access. */
            201: {
                headers: {
                    /** @description Restricted server-side session cookie. */
                    "Set-Cookie"?: string;
                    "Cache-Control": components["headers"]["NoStore"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SignupResponse"];
                };
            };
            400: components["responses"]["BadRequest"];
            409: components["responses"]["Conflict"];
            429: components["responses"]["TooManyRequests"];
        };
    };
    login: {
        parameters: {
            query?: never;
            header: {
                /** @description Token returned by the same-origin CSRF bootstrap operation. */
                "X-CSRFToken": components["parameters"]["CsrfToken"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LoginRequest"];
            };
        };
        responses: {
            /** @description Session established. */
            200: {
                headers: {
                    /** @description Rotated server-side session cookie. */
                    "Set-Cookie"?: string;
                    "Cache-Control": components["headers"]["NoStore"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LoginResponse"];
                };
            };
            400: components["responses"]["BadRequest"];
            /** @description Invalid credentials. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            429: components["responses"]["TooManyRequests"];
        };
    };
    logout: {
        parameters: {
            query?: never;
            header: {
                /** @description Token returned by the same-origin CSRF bootstrap operation. */
                "X-CSRFToken": components["parameters"]["CsrfToken"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Current session revoked. */
            204: {
                headers: {
                    /** @description Expired session cookie. */
                    "Set-Cookie"?: string;
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: components["responses"]["Unauthorized"];
        };
    };
    getCurrentUser: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Current user. */
            200: {
                headers: {
                    "Cache-Control": components["headers"]["NoStore"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserResponse"];
                };
            };
            401: components["responses"]["Unauthorized"];
        };
    };
    verifyEmail: {
        parameters: {
            query?: never;
            header: {
                /** @description Token returned by the same-origin CSRF bootstrap operation. */
                "X-CSRFToken": components["parameters"]["CsrfToken"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EmailVerificationRequest"];
            };
        };
        responses: {
            /** @description Initial account email verified without treating the bearer as a login credential. */
            204: {
                headers: {
                    /**
                     * @description Rotated authenticated session cookie only when a matching restricted
                     *     same-browser session was already present and upgraded.
                     */
                    "Set-Cookie"?: string;
                    "Cache-Control": components["headers"]["NoStore"];
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            409: components["responses"]["Conflict"];
            429: components["responses"]["TooManyRequests"];
        };
    };
    resendEmailVerification: {
        parameters: {
            query?: never;
            header: {
                /** @description Token returned by the same-origin CSRF bootstrap operation. */
                "X-CSRFToken": components["parameters"]["CsrfToken"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Verification delivery recorded and attempted. */
            200: {
                headers: {
                    "Cache-Control": components["headers"]["NoStore"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ResendVerificationResponse"];
                };
            };
            401: components["responses"]["Unauthorized"];
            /** @description Email is already verified or a lifecycle transition conflicts. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            429: components["responses"]["TooManyRequests"];
        };
    };
    requestPrimaryEmailChange: {
        parameters: {
            query?: never;
            header: {
                /** @description Token returned by the same-origin CSRF bootstrap operation. */
                "X-CSRFToken": components["parameters"]["CsrfToken"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PrimaryEmailChangeRequest"];
            };
        };
        responses: {
            /** @description Pending primary-email change created and delivery attempted. */
            202: {
                headers: {
                    "Cache-Control": components["headers"]["NoStore"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ResendVerificationResponse"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            /** @description Recent reauthentication is required. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description The address is current, already used, or incompatible with the account state. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            429: components["responses"]["TooManyRequests"];
        };
    };
    verifyPrimaryEmailChange: {
        parameters: {
            query?: never;
            header: {
                /** @description Token returned by the same-origin CSRF bootstrap operation. */
                "X-CSRFToken": components["parameters"]["CsrfToken"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["EmailVerificationRequest"];
            };
        };
        responses: {
            /** @description New primary email verified; other sessions revoked and current session rotated. */
            204: {
                headers: {
                    /** @description Rotated current session cookie. */
                    "Set-Cookie"?: string;
                    "Cache-Control": components["headers"]["NoStore"];
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            /** @description Recent reauthentication is required. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description No compatible pending primary-email change can be completed. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            429: components["responses"]["TooManyRequests"];
        };
    };
    requestPasswordReset: {
        parameters: {
            query?: never;
            header: {
                /** @description Token returned by the same-origin CSRF bootstrap operation. */
                "X-CSRFToken": components["parameters"]["CsrfToken"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PasswordResetRequest"];
            };
        };
        responses: {
            /** @description Request accepted without disclosing account existence or delivery state. */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AcknowledgementResponse"];
                };
            };
            400: components["responses"]["BadRequest"];
            429: components["responses"]["TooManyRequests"];
        };
    };
    resetPassword: {
        parameters: {
            query?: never;
            header: {
                /** @description Token returned by the same-origin CSRF bootstrap operation. */
                "X-CSRFToken": components["parameters"]["CsrfToken"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PasswordResetConfirmRequest"];
            };
        };
        responses: {
            /** @description Password changed and all sessions revoked. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            409: components["responses"]["Conflict"];
            429: components["responses"]["TooManyRequests"];
        };
    };
    changePassword: {
        parameters: {
            query?: never;
            header: {
                /** @description Token returned by the same-origin CSRF bootstrap operation. */
                "X-CSRFToken": components["parameters"]["CsrfToken"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PasswordChangeRequest"];
            };
        };
        responses: {
            /** @description Password changed, other sessions revoked, and current session rotated. */
            204: {
                headers: {
                    /** @description Rotated current session cookie. */
                    "Set-Cookie"?: string;
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            /** @description The account has no current password or is in an incompatible identity state. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    startGoogleLogin: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Redirect to Google's authorization endpoint. */
            302: {
                headers: {
                    /** @description Google authorization URL containing an unpredictable state value. */
                    Location?: string;
                    /** @description Session cookie retaining the OAuth state correlation. */
                    "Set-Cookie"?: string;
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    completeGoogleOAuth: {
        parameters: {
            query: {
                code: string;
                state: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OAuth completed; session rotated and browser redirected to the frontend. */
            302: {
                headers: {
                    /** @description Same-origin frontend completion URL without provider credentials. */
                    Location?: string;
                    /** @description Rotated authenticated session cookie. */
                    "Set-Cookie"?: string;
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            /** @description Existing account requires explicit authenticated linking. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    startGoogleLink: {
        parameters: {
            query?: never;
            header: {
                /** @description Token returned by the same-origin CSRF bootstrap operation. */
                "X-CSRFToken": components["parameters"]["CsrfToken"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Link authorization URL created. */
            200: {
                headers: {
                    "Cache-Control": components["headers"]["NoStore"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OAuthLinkStartResponse"];
                };
            };
            401: components["responses"]["Unauthorized"];
            /** @description Recent reauthentication is required. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Google is already linked or another link state conflicts. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    unlinkGoogle: {
        parameters: {
            query?: never;
            header: {
                /** @description Token returned by the same-origin CSRF bootstrap operation. */
                "X-CSRFToken": components["parameters"]["CsrfToken"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Google link removed; other sessions revoked and current session rotated. */
            204: {
                headers: {
                    /** @description Rotated current session cookie. */
                    "Set-Cookie"?: string;
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: components["responses"]["Unauthorized"];
            /** @description Recent reauthentication is required. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Google is not linked or the account is in an incompatible lifecycle state. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    listHouseholds: {
        parameters: {
            query?: {
                page?: components["parameters"]["Page"];
                limit?: components["parameters"]["Limit"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Household page. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HouseholdListResponse"];
                };
            };
            401: components["responses"]["Unauthorized"];
            /** @description Email verification is required before household access. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    createHousehold: {
        parameters: {
            query?: never;
            header: {
                /** @description Token returned by the same-origin CSRF bootstrap operation. */
                "X-CSRFToken": components["parameters"]["CsrfToken"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["HouseholdCreateRequest"];
            };
        };
        responses: {
            /** @description Household created. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HouseholdResponse"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
        };
    };
    getHousehold: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                household_id: components["parameters"]["HouseholdId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Household details. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HouseholdResponse"];
                };
            };
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
        };
    };
    deleteHousehold: {
        parameters: {
            query?: never;
            header: {
                /** @description Token returned by the same-origin CSRF bootstrap operation. */
                "X-CSRFToken": components["parameters"]["CsrfToken"];
            };
            path: {
                household_id: components["parameters"]["HouseholdId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Household soft-deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
        };
    };
    updateHousehold: {
        parameters: {
            query?: never;
            header: {
                /** @description Token returned by the same-origin CSRF bootstrap operation. */
                "X-CSRFToken": components["parameters"]["CsrfToken"];
            };
            path: {
                household_id: components["parameters"]["HouseholdId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["HouseholdUpdateRequest"];
            };
        };
        responses: {
            /** @description Household updated. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HouseholdResponse"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
        };
    };
    getHouseholdCode: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                household_id: components["parameters"]["HouseholdId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Current join code. */
            200: {
                headers: {
                    "Cache-Control": components["headers"]["NoStore"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HouseholdCodeResponse"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
        };
    };
    regenerateHouseholdCode: {
        parameters: {
            query?: never;
            header: {
                /** @description Token returned by the same-origin CSRF bootstrap operation. */
                "X-CSRFToken": components["parameters"]["CsrfToken"];
            };
            path: {
                household_id: components["parameters"]["HouseholdId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description New join code. */
            200: {
                headers: {
                    "Cache-Control": components["headers"]["NoStore"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HouseholdCodeResponse"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
        };
    };
    joinHouseholdByCode: {
        parameters: {
            query?: never;
            header: {
                /** @description Token returned by the same-origin CSRF bootstrap operation. */
                "X-CSRFToken": components["parameters"]["CsrfToken"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["HouseholdJoinRequest"];
            };
        };
        responses: {
            /** @description Household joined. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HouseholdSummary"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            /** @description Invalid or inactive code; household existence is not disclosed. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description User is already a member. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    listHouseholdMembers: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                household_id: components["parameters"]["HouseholdId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Active memberships. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MembershipListResponse"];
                };
            };
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
        };
    };
    removeHouseholdMember: {
        parameters: {
            query?: never;
            header: {
                /** @description Token returned by the same-origin CSRF bootstrap operation. */
                "X-CSRFToken": components["parameters"]["CsrfToken"];
            };
            path: {
                household_id: components["parameters"]["HouseholdId"];
                user_id: components["parameters"]["UserId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Membership removed. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            /** @description The target membership cannot be removed in its current owner/state relationship. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    listHouseholdInvitations: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                household_id: components["parameters"]["HouseholdId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Invitations visible to the Owner. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InvitationListResponse"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
        };
    };
    createHouseholdInvitation: {
        parameters: {
            query?: never;
            header: {
                /** @description Token returned by the same-origin CSRF bootstrap operation. */
                "X-CSRFToken": components["parameters"]["CsrfToken"];
            };
            path: {
                household_id: components["parameters"]["HouseholdId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["InvitationCreateRequest"];
            };
        };
        responses: {
            /** @description Invitation created and delivery attempted. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InvitationDeliveryResponse"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            /** @description Target is already a member or has a conflicting active invitation. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            429: components["responses"]["TooManyRequests"];
        };
    };
    revokeHouseholdInvitation: {
        parameters: {
            query?: never;
            header: {
                /** @description Token returned by the same-origin CSRF bootstrap operation. */
                "X-CSRFToken": components["parameters"]["CsrfToken"];
            };
            path: {
                household_id: components["parameters"]["HouseholdId"];
                invitation_id: components["parameters"]["InvitationId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Invitation revoked. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
        };
    };
    resendHouseholdInvitation: {
        parameters: {
            query?: never;
            header: {
                /** @description Token returned by the same-origin CSRF bootstrap operation. */
                "X-CSRFToken": components["parameters"]["CsrfToken"];
            };
            path: {
                household_id: components["parameters"]["HouseholdId"];
                invitation_id: components["parameters"]["InvitationId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Invitation verifier rotated and delivery attempted. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InvitationDeliveryResponse"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            /** @description Invitation is not in a resendable pending state. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            429: components["responses"]["TooManyRequests"];
        };
    };
    exchangeInvitationVerifier: {
        parameters: {
            query?: never;
            header: {
                /** @description Token returned by the same-origin CSRF bootstrap operation. */
                "X-CSRFToken": components["parameters"]["CsrfToken"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["InvitationExchangeRequest"];
            };
        };
        responses: {
            /** @description Generation-bound pending intent stored in the current browser session. */
            204: {
                headers: {
                    /** @description Anonymous or rotated server-side session cookie. */
                    "Set-Cookie"?: string;
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            /** @description Verifier is invalid, expired, rotated, or otherwise unusable. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            409: components["responses"]["Conflict"];
            429: components["responses"]["TooManyRequests"];
        };
    };
    previewPendingInvitation: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Safe invitation preview. */
            200: {
                headers: {
                    "Cache-Control": components["headers"]["NoStore"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InvitationPreviewResponse"];
                };
            };
            401: components["responses"]["Unauthorized"];
            /** @description No authorized usable intent exists, including absent, stale, unverified, or wrong-email state. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    acceptPendingInvitation: {
        parameters: {
            query?: never;
            header: {
                /** @description Token returned by the same-origin CSRF bootstrap operation. */
                "X-CSRFToken": components["parameters"]["CsrfToken"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Invitation accepted atomically. */
            200: {
                headers: {
                    "Cache-Control": components["headers"]["NoStore"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InvitationAcceptResponse"];
                };
            };
            401: components["responses"]["Unauthorized"];
            /** @description No authorized usable intent exists, including absent, stale, unverified, or wrong-email state. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            /** @description Membership already exists after a valid matched intent. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
        };
    };
    listTasks: {
        parameters: {
            query?: {
                page?: components["parameters"]["Page"];
                limit?: components["parameters"]["Limit"];
                completed?: boolean;
                assigned_to_membership_id?: string;
                /** @description Include tasks due on or before this calendar date. */
                due_before?: string;
                /** @description Include tasks due on or after this calendar date. */
                due_after?: string;
            };
            header?: never;
            path: {
                household_id: components["parameters"]["HouseholdId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Task page. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TaskListResponse"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
        };
    };
    createTask: {
        parameters: {
            query?: never;
            header: {
                /** @description Token returned by the same-origin CSRF bootstrap operation. */
                "X-CSRFToken": components["parameters"]["CsrfToken"];
            };
            path: {
                household_id: components["parameters"]["HouseholdId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TaskCreateRequest"];
            };
        };
        responses: {
            /** @description Task created. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TaskResponse"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
        };
    };
    getTask: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                household_id: components["parameters"]["HouseholdId"];
                task_id: components["parameters"]["TaskId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Task details. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TaskResponse"];
                };
            };
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
        };
    };
    deleteTask: {
        parameters: {
            query?: never;
            header: {
                /** @description Token returned by the same-origin CSRF bootstrap operation. */
                "X-CSRFToken": components["parameters"]["CsrfToken"];
            };
            path: {
                household_id: components["parameters"]["HouseholdId"];
                task_id: components["parameters"]["TaskId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Task permanently deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
        };
    };
    updateTask: {
        parameters: {
            query?: never;
            header: {
                /** @description Token returned by the same-origin CSRF bootstrap operation. */
                "X-CSRFToken": components["parameters"]["CsrfToken"];
            };
            path: {
                household_id: components["parameters"]["HouseholdId"];
                task_id: components["parameters"]["TaskId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TaskUpdateRequest"];
            };
        };
        responses: {
            /** @description Task updated. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TaskResponse"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            /** @description Caller may access the task but may not change its assignment. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorResponse"];
                };
            };
            404: components["responses"]["NotFound"];
        };
    };
    setTaskCompletion: {
        parameters: {
            query?: never;
            header: {
                /** @description Token returned by the same-origin CSRF bootstrap operation. */
                "X-CSRFToken": components["parameters"]["CsrfToken"];
            };
            path: {
                household_id: components["parameters"]["HouseholdId"];
                task_id: components["parameters"]["TaskId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TaskCompletionRequest"];
            };
        };
        responses: {
            /** @description Completion state updated. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TaskResponse"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
        };
    };
    listShoppingItems: {
        parameters: {
            query?: {
                page?: components["parameters"]["Page"];
                limit?: components["parameters"]["Limit"];
                purchased?: boolean;
            };
            header?: never;
            path: {
                household_id: components["parameters"]["HouseholdId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Shopping-item page. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ShoppingItemListResponse"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
        };
    };
    createShoppingItem: {
        parameters: {
            query?: never;
            header: {
                /** @description Token returned by the same-origin CSRF bootstrap operation. */
                "X-CSRFToken": components["parameters"]["CsrfToken"];
            };
            path: {
                household_id: components["parameters"]["HouseholdId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ShoppingItemCreateRequest"];
            };
        };
        responses: {
            /** @description Shopping item created. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ShoppingItemResponse"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
        };
    };
    deleteShoppingItem: {
        parameters: {
            query?: never;
            header: {
                /** @description Token returned by the same-origin CSRF bootstrap operation. */
                "X-CSRFToken": components["parameters"]["CsrfToken"];
            };
            path: {
                household_id: components["parameters"]["HouseholdId"];
                item_id: components["parameters"]["ShoppingItemId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Shopping item permanently deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
        };
    };
    updateShoppingItem: {
        parameters: {
            query?: never;
            header: {
                /** @description Token returned by the same-origin CSRF bootstrap operation. */
                "X-CSRFToken": components["parameters"]["CsrfToken"];
            };
            path: {
                household_id: components["parameters"]["HouseholdId"];
                item_id: components["parameters"]["ShoppingItemId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ShoppingItemUpdateRequest"];
            };
        };
        responses: {
            /** @description Shopping item updated. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ShoppingItemResponse"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
        };
    };
    clearPurchasedShoppingItems: {
        parameters: {
            query?: never;
            header: {
                /** @description Token returned by the same-origin CSRF bootstrap operation. */
                "X-CSRFToken": components["parameters"]["CsrfToken"];
            };
            path: {
                household_id: components["parameters"]["HouseholdId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Purchased items permanently deleted. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BulkDeleteResponse"];
                };
            };
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
        };
    };
    listExpenses: {
        parameters: {
            query?: {
                page?: components["parameters"]["Page"];
                limit?: components["parameters"]["Limit"];
                category?: components["schemas"]["ExpenseCategory"];
                payer_id?: string;
                /** @description Include expenses incurred on or after this date. */
                date_from?: string;
                /** @description Include expenses incurred on or before this date. */
                date_to?: string;
            };
            header?: never;
            path: {
                household_id: components["parameters"]["HouseholdId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Expense page and same-currency aggregates. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ExpenseListResponse"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
        };
    };
    createExpense: {
        parameters: {
            query?: never;
            header: {
                /** @description Token returned by the same-origin CSRF bootstrap operation. */
                "X-CSRFToken": components["parameters"]["CsrfToken"];
            };
            path: {
                household_id: components["parameters"]["HouseholdId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ExpenseCreateRequest"];
            };
        };
        responses: {
            /** @description Expense created. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ExpenseResponse"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
        };
    };
    deleteExpense: {
        parameters: {
            query?: never;
            header: {
                /** @description Token returned by the same-origin CSRF bootstrap operation. */
                "X-CSRFToken": components["parameters"]["CsrfToken"];
            };
            path: {
                household_id: components["parameters"]["HouseholdId"];
                expense_id: components["parameters"]["ExpenseId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Expense permanently deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
        };
    };
    updateExpense: {
        parameters: {
            query?: never;
            header: {
                /** @description Token returned by the same-origin CSRF bootstrap operation. */
                "X-CSRFToken": components["parameters"]["CsrfToken"];
            };
            path: {
                household_id: components["parameters"]["HouseholdId"];
                expense_id: components["parameters"]["ExpenseId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ExpenseUpdateRequest"];
            };
        };
        responses: {
            /** @description Expense updated. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ExpenseResponse"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
        };
    };
    listInventoryItems: {
        parameters: {
            query?: {
                page?: components["parameters"]["Page"];
                limit?: components["parameters"]["Limit"];
                category?: string;
            };
            header?: never;
            path: {
                household_id: components["parameters"]["HouseholdId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Inventory-item page. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InventoryItemListResponse"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
        };
    };
    createInventoryItem: {
        parameters: {
            query?: never;
            header: {
                /** @description Token returned by the same-origin CSRF bootstrap operation. */
                "X-CSRFToken": components["parameters"]["CsrfToken"];
            };
            path: {
                household_id: components["parameters"]["HouseholdId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["InventoryItemCreateRequest"];
            };
        };
        responses: {
            /** @description Inventory item created. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InventoryItemResponse"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
        };
    };
    deleteInventoryItem: {
        parameters: {
            query?: never;
            header: {
                /** @description Token returned by the same-origin CSRF bootstrap operation. */
                "X-CSRFToken": components["parameters"]["CsrfToken"];
            };
            path: {
                household_id: components["parameters"]["HouseholdId"];
                item_id: components["parameters"]["InventoryItemId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Inventory item permanently deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
        };
    };
    updateInventoryItem: {
        parameters: {
            query?: never;
            header: {
                /** @description Token returned by the same-origin CSRF bootstrap operation. */
                "X-CSRFToken": components["parameters"]["CsrfToken"];
            };
            path: {
                household_id: components["parameters"]["HouseholdId"];
                item_id: components["parameters"]["InventoryItemId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["InventoryItemUpdateRequest"];
            };
        };
        responses: {
            /** @description Inventory item updated. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InventoryItemResponse"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
        };
    };
    getHouseholdDashboard: {
        parameters: {
            query: {
                /** @description Browser-local full calendar date used for due-date classification. */
                as_of: string;
            };
            header?: never;
            path: {
                household_id: components["parameters"]["HouseholdId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Minimal dashboard projection. */
            200: {
                headers: {
                    "Cache-Control": components["headers"]["NoStore"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DashboardResponse"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
        };
    };
}
