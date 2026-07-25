# Graph Report - .  (2026-07-25)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 3358 nodes · 8188 edges · 186 communities (165 shown, 21 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 70 edges (avg confidence: 0.67)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4a98f5ed`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- admin-pages.lazy.tsx
- admin-barang.service.ts
- admin-inventory-workspace.tsx
- superadmin-pages.tsx
- cn
- admin-pemasaran.service.ts
- user-pages.tsx
- unit-form.tsx
- admin-transaction-pages.tsx
- toast.tsx
- admin-pages.tsx
- mock-data.ts
- monitoring.service.ts
- auction-winner-hero-stage.tsx
- wishlist.service.ts
- admin-unit.service.ts
- notification.service.ts
- unit.service.ts
- admin-marketing-pages.tsx
- cron.service.ts
- admin-dashboard.service.ts
- superadmin-pages.lazy.tsx
- superadmin-account-workspace.tsx
- admin-barang-edit-form.tsx
- wishlist-page.tsx
- catalog-page.tsx
- compilerOptions
- admin-transaction.service.ts
- superadmin-account.service.ts
- superadmin-blacklist-detail-workspace.tsx
- public-pages.tsx
- admin-dashboard-trend-chart.tsx
- profile-settings-form.tsx
- transactions-workspace.tsx
- formatSuperAdminDateTime
- cross-unit-violation-scenario.ts
- getServerSession
- devDependencies
- button.tsx
- admin-dashboard-page.tsx
- superadmin/validation.ts
- admin-blacklist.service.ts
- buyer.service.ts
- MarketingFeedRow
- superadmin-unit-barang-detail-page.tsx
- admin-redeem-form.tsx
- buyer.ts
- session.ts
- lib/auth.ts
- dependencies
- admin-blacklist-detail-workspace.tsx
- refreshBuyerAuctionSettlementState
- categories.ts
- renewed-cross-unit-violation-scenario.ts
- notification-events.ts
- unit-admin-audit-repair.ts
- apply-cross-unit-violation-scenario.ts
- rekening-unit.service.ts
- role-notifications-panel.tsx
- build_kuesioner_uat.py
- admin-unit/validation.ts
- buyer-top-nav.tsx
- getCountdownState
- auction-loser-hero-stage.tsx
- effective-state.ts
- public-catalog.service.ts
- dashboard-shell.tsx
- catalog.ts
- SuperAdminUnitInventorySection
- apply-renewed-cross-unit-violation-scenario.ts
- fixed-price-rejected-relist-repair.ts
- scripts
- requireBuyerApiSession
- alert-center.tsx
- admin-unit/serializers.ts
- buyer/serializers.ts
- formatAppDateTime
- public-shell.tsx
- admin-dashboard-checklist-card.tsx
- dateLabel
- auction-loser-page.tsx
- superadmin-pages.test.tsx
- requireSuperAdminApiSession
- SuperAdminDashboardPage
- createFixedPricePurchase
- buyer-violation-page.tsx
- humanize
- storage.ts
- components.json
- specifications.ts
- vickrey-ranking-table.tsx
- obsolete-database-cleanup.ts
- isVickreyPaymentFulfilled
- SuperAdminVickreyReceiptInlinePrint
- user-dashboard-page.tsx
- AdminFixedPriceDetailPage
- account-profile.service.ts
- uploadAdminTransactionHandoverProof
- app/layout.tsx
- AdminVickreyAuctionListPage
- BuyerSessionUser
- transaction-links.ts
- notifications-page.tsx
- lot-realtime-stats.tsx
- report-range-dropdown.tsx
- buyer/validation.ts
- package.json
- stats/route.ts
- submitVickreyBid
- syncBuyerRestrictionNotifications
- transaction-receipt-page.test.tsx
- transaction-receipt-inline-print.tsx
- admin-blacklist-service.test.ts
- [...path]/route.ts
- detail-favorite-toggle.tsx
- guards.ts
- backfill-blacklist-violation-totals.ts
- cron-overdue-idempotency.test.ts
- help-center-page.tsx
- katalog/[id]/page.tsx
- admin-barang-detail-media-viewer.tsx
- buyer-vickrey-pages.test.tsx
- lot-media-gallery.tsx
- catalog-page.test.tsx
- marketing-performance-panel.tsx
- fixed-price-visibility.ts
- wishlist.ts
- apply-handover-proof-migration.ts
- render_plantuml_online.py
- eslint.config.mjs
- marketing-edit-policy.ts
- remove-handover-complaint.ts
- apply-canonical-codes-migration.ts
- apply-customer-data-standard-migration.ts
- buyer-alert-center.test.tsx
- compact-transaction-progress.tsx
- next.config.mjs
- apply-handover-auto-completion-migration.ts
- notification-routes.test.ts
- listAdminTransactions
- middleware.ts
- start-production.mjs
- superadmin-account-routes.test.ts
- vercel.json
- jsdom
- next-env.d.ts
- tailwindcss
- @types/pg
- postcss.config.mjs
- tailwind.config.ts
- cron-route.test.ts
- profile-email-routes.test.ts
- session
- verification
- buyerProfile

## God Nodes (most connected - your core abstractions)
1. `cn()` - 237 edges
2. `useToast()` - 50 edges
3. `formatAppDateTime()` - 50 edges
4. `requireAdminApiSession()` - 47 edges
5. `requireSuperAdminApiSession()` - 42 edges
6. `getAdminUnitPageContext()` - 37 edges
7. `Button` - 34 edges
8. `requireBuyerApiSession()` - 30 edges
9. `getBuyerSessionUser()` - 28 edges
10. `db` - 28 edges

## Surprising Connections (you probably didn't know these)
- `auditScenario()` --indirect_call--> `ids()`  [INFERRED]
  scripts/apply-cross-unit-violation-scenario.ts → lib/blacklist/cross-unit-violation-scenario.ts
- `AdminDatePicker()` --indirect_call--> `date()`  [INFERRED]
  components/admin-unit/admin-date-picker.tsx → lib/blacklist/renewed-cross-unit-violation-scenario.ts
- `ModeCard()` --calls--> `cn()`  [EXTRACTED]
  components/admin-unit/admin-marketing-form.tsx → lib/utils.ts
- `getInitialCalendarMonth()` --indirect_call--> `date()`  [INFERRED]
  components/admin/admin-inventory-workspace.tsx → lib/blacklist/renewed-cross-unit-violation-scenario.ts
- `AdminInventoryHistoryWorkspace()` --indirect_call--> `date()`  [INFERRED]
  components/admin/admin-inventory-workspace.tsx → lib/blacklist/renewed-cross-unit-violation-scenario.ts

## Import Cycles
- None detected.

## Communities (186 total, 21 thin omitted)

### Community 0 - "admin-pages.lazy.tsx"
Cohesion: 0.04
Nodes (59): Page(), Page(), Page(), Page(), Page(), Page(), Page(), Page() (+51 more)

### Community 1 - "admin-barang.service.ts"
Cohesion: 0.05
Nodes (64): Context, POST(), Context, DELETE(), Context, POST(), readMediaPayload(), Context (+56 more)

### Community 2 - "admin-inventory-workspace.tsx"
Cohesion: 0.05
Nodes (67): AdminBlacklistItem, AdminBlacklistList(), BlacklistFilter, formatShortDate(), getCountdownTarget(), getDaysUntil(), getEntryLevel(), getIncidentDate() (+59 more)

### Community 3 - "superadmin-pages.tsx"
Cohesion: 0.03
Nodes (49): addEventToDashboardPoint(), buildCustomDashboardTrendRange(), createDashboardTrendPoint(), dashboardAmountTickValues, dashboardChartFrame, dashboardMonthLabels, dashboardNumberFormatter, dashboardTrendRangeOptions (+41 more)

### Community 4 - "cn"
Cohesion: 0.05
Nodes (36): AdminInventoryCreateForm(), AdminMediaUploadGallery(), categoryOptions, CategorySegments(), ChecklistItem(), ChecklistState, conditionOptions, ConditionSegments() (+28 more)

### Community 5 - "admin-pemasaran.service.ts"
Cohesion: 0.06
Nodes (47): Page(), Page(), Context, GET(), GET(), AdminInventoryPage(), getAdminInventoryMetrics(), LotInsights (+39 more)

### Community 6 - "user-pages.tsx"
Cohesion: 0.05
Nodes (48): SuperAdminUnitDetailAccountLedger(), BidHistoryPage(), BidPaymentContext(), bidStatusMeta, BuyerDashboardViolation, BuyerProfileStatus, BuyerSummary, BuyerTransactionInlineReceiptPrint() (+40 more)

### Community 7 - "unit-form.tsx"
Cohesion: 0.07
Nodes (38): AdminSelect(), CompletePurchaseButton(), VICKREY_TERMS, VickreyBidFormProps, VIOLATION_LEVELS, AdminFormProps, AdminUnitForm(), DeactivateAdminButton() (+30 more)

### Community 8 - "admin-transaction-pages.tsx"
Cohesion: 0.07
Nodes (47): ADMIN_PAGE_SIZE_OPTIONS, AdminPaginationFooter(), getPaginationItems(), AdminStatusBadge(), AdminUnitActionButton(), AdminPurchaseTimeline(), AdminTransactionDetailWorkspacePage(), AdminTransactionHistoryPage() (+39 more)

### Community 9 - "toast.tsx"
Cohesion: 0.06
Nodes (34): AuthLayout(), HandoverProofUploadForm(), HandoverProofUploadFormProps, LoginForm(), RegisterForm(), BuyerPaymentProofForm(), BuyerPaymentProofFormProps, getProofDisplayName() (+26 more)

### Community 10 - "admin-pages.tsx"
Cohesion: 0.05
Nodes (26): AdminAuctionDetailPage(), AdminAuctionItem, AdminBarangHistoryActionKey, AdminBarangMedia, AdminBlacklistDetailPage(), AdminBlacklistItem, AdminBlacklistPage(), AdminHeroPill() (+18 more)

### Community 11 - "mock-data.ts"
Cohesion: 0.04
Nodes (36): AdminAuctionStatus, AdminBlacklistStatus, AdminInventoryStatus, AdminStatus, AdminStatusMeta, AdminTransactionStatus, AppRole, statusMeta (+28 more)

### Community 12 - "monitoring.service.ts"
Cohesion: 0.08
Nodes (39): GET(), Page(), Page(), SuperAdminMonitoringPage(), addDays(), addRowToTrendPoint(), buildSuperAdminUnitRowsQuery(), buildValidatedTrend() (+31 more)

### Community 13 - "auction-winner-hero-stage.tsx"
Cohesion: 0.06
Nodes (34): AuctionWinnerCountdown(), AuctionWinnerCountdownProps, CountdownParts, getTargetParts(), AuctionWinnerHeroStage(), AuctionWinnerHeroStageProps, BURST_COLORS, BURST_CONFETTI_PIECES (+26 more)

### Community 14 - "wishlist.service.ts"
Cohesion: 0.07
Nodes (33): Page(), barang, barangSbgNumberSequence, mediaBarang, pemasaran, pemasaranViews, riwayatPerpanjangan, riwayatStatusBarang (+25 more)

### Community 15 - "admin-unit.service.ts"
Cohesion: 0.09
Nodes (32): DELETE(), GET(), PUT(), toErrorResponse(), GET(), POST(), toErrorResponse(), GET() (+24 more)

### Community 16 - "notification.service.ts"
Cohesion: 0.09
Nodes (30): PATCH(), POST(), GET(), Context, PATCH(), POST(), GET(), Context (+22 more)

### Community 17 - "unit.service.ts"
Cohesion: 0.09
Nodes (33): POST(), toErrorResponse(), Page(), getCachedUnitById, Page(), Page(), SuperAdminManagementUnitDetailPage(), SuperAdminUnitAccountsPage() (+25 more)

### Community 18 - "admin-marketing-pages.tsx"
Cohesion: 0.07
Nodes (29): AdminSelectOption, buildLatestMarketingFeedItems(), compactCountdownValue(), compareMarketingRecency(), fixedPriceRejectionReasonOptions, fixedPriceRejectionReasons, formatCountdownUnit(), getBidDisplayRows() (+21 more)

### Community 19 - "cron.service.ts"
Cohesion: 0.11
Nodes (35): GET(), handleCron(), POST(), BlacklistDurationUnit, BlacklistRestrictionLevel, BlacklistRestrictionPolicy, getBlacklistBlockedUntil(), getBlacklistDurationDays() (+27 more)

### Community 20 - "admin-dashboard.service.ts"
Cohesion: 0.14
Nodes (38): label(), actionLabel(), AuditAccountPanel(), auditTimelineLabel(), buildAuditCalendarCells(), getAuditActionOption(), getInitialAuditCalendarMonth(), matchesAuditTimelineFilter() (+30 more)

### Community 21 - "superadmin-pages.lazy.tsx"
Cohesion: 0.06
Nodes (28): ComponentObjectProps, LazySuperAdminAdminsPage, LazySuperAdminBlacklistPage, LazySuperAdminCreateUnitPage, LazySuperAdminDashboardPage, LazySuperAdminManagementAdminDetailPage, LazySuperAdminManagementPage, LazySuperAdminManagementUnitDetailPage (+20 more)

### Community 22 - "superadmin-account-workspace.tsx"
Cohesion: 0.07
Nodes (27): Page(), auditActionCatalog, AuditActionFilter, auditActionFilterOptions, AuditTimelineFilter, auditTimelineOptions, dayLabels, DetailRow() (+19 more)

### Community 23 - "admin-barang-edit-form.tsx"
Cohesion: 0.10
Nodes (24): AdminBarangEditForm(), AdminBarangEditSubmitPayload, AdminBarangEditValue, categories, conditions, getSpecificationSuffix(), normalizeDigits(), normalizeEditableCategory() (+16 more)

### Community 24 - "wishlist-page.tsx"
Cohesion: 0.09
Nodes (30): CheckFilterButton(), clamp(), FilterSection(), formatPriceInput(), getCategoryIcon(), getCountLabel(), getPaginationItems(), getSubtype() (+22 more)

### Community 25 - "catalog-page.tsx"
Cohesion: 0.10
Nodes (28): CatalogLotCard(), CatalogLotStats(), CatalogPage(), CatalogPageProps, CheckFilterButton(), clamp(), EMPTY_FAVORITE_IDS, formatCompactCurrency() (+20 more)

### Community 26 - "compilerOptions"
Cohesion: 0.06
Nodes (33): dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node, node_modules, @testing-library/jest-dom (+25 more)

### Community 27 - "admin-transaction.service.ts"
Cohesion: 0.12
Nodes (25): Context, GET(), Context, POST(), Context, POST(), Page(), ensureTransactionMutable() (+17 more)

### Community 28 - "superadmin-account.service.ts"
Cohesion: 0.16
Nodes (28): GET(), POST(), toErrorResponse(), Page(), activeOwnerWhere(), ActorRow, assertEmailAvailable(), assertOwnerGuardrail() (+20 more)

### Community 29 - "superadmin-blacklist-detail-workspace.tsx"
Cohesion: 0.13
Nodes (28): BlacklistDetailScope, clampLevel(), CountdownPanel(), formatDisplayDate(), formatDisplayDateTime(), formatMoney(), getCurrentViolationItem(), getDeadline() (+20 more)

### Community 30 - "public-pages.tsx"
Cohesion: 0.11
Nodes (23): metadata, VickreyBidForm(), BuyerPublicStatus, DetailInfoItem, formatOptionalDate(), getBlacklistLabel(), getPriceChangeCopy(), getVickreyBidLockLabel() (+15 more)

### Community 31 - "admin-dashboard-trend-chart.tsx"
Cohesion: 0.12
Nodes (29): addEventToTrendPoint(), AdminDashboardTrendChart(), buildChartModel(), buildStripMetrics(), chartAxisTextStyle, chartAxisTickValues, createTrendPoint(), DashboardStripMetric (+21 more)

### Community 32 - "profile-settings-form.tsx"
Cohesion: 0.09
Nodes (21): ActivePanel, AdminProfileData, AdminProfileWorkspace(), DetailRow(), getInitials(), ProfileCard(), LoginHistoryDialog(), LoginHistoryDialogProps (+13 more)

### Community 33 - "transactions-workspace.tsx"
Cohesion: 0.10
Nodes (28): BidFilter, BidRow(), FilterChip(), FilterTone, formatCompactCountdownLabel(), getBidFilterStatus(), getBidStatusPill(), getFilterToneMeta() (+20 more)

### Community 34 - "formatSuperAdminDateTime"
Cohesion: 0.11
Nodes (30): FAILED_SUPERADMIN_VICKREY_TRANSACTION_STATUSES, formatSuperAdminDateTime(), formatSuperAdminOptionalCurrency(), getSuperAdminHighestBidAmount(), getSuperAdminMechanismBadgeTextClass(), getSuperAdminMechanismCurrencyTextClass(), getSuperAdminMechanismDateTextClass(), getSuperAdminProgressCompletionLabel() (+22 more)

### Community 35 - "cross-unit-violation-scenario.ts"
Cohesion: 0.12
Nodes (25): assert(), CROSS_UNIT_SCENARIO_EMAILS, CROSS_UNIT_SCENARIO_IDENTITIES, CROSS_UNIT_VIOLATION_SCENARIO, CrossUnitScenarioEmail, CrossUnitViolationIncident, defineIncident(), getExpectedFinalRestrictions() (+17 more)

### Community 36 - "getServerSession"
Cohesion: 0.12
Nodes (16): GET(), metadata, Page(), CatalogResults(), getCachedPublicLots, PublicLayout(), GET(), LoginPage() (+8 more)

### Community 37 - "devDependencies"
Cohesion: 0.07
Nodes (29): autoprefixer, drizzle-kit, eslint, eslint-config-next, devDependencies, autoprefixer, drizzle-kit, eslint (+21 more)

### Community 38 - "button.tsx"
Cohesion: 0.10
Nodes (18): AdminBarangMedia, AdminBarangMediaDraftChange, AdminBarangMediaManager(), DraftMedia, revokePreviewUrl(), AdminMarketingAvailabilityAction(), hasDeadlineElapsed(), AdminUnitActionButtonProps (+10 more)

### Community 39 - "admin-dashboard-page.tsx"
Cohesion: 0.10
Nodes (27): ACTIONABLE_TRANSACTION_STATUSES, AdminDashboardData, AdminDashboardHero(), AdminDashboardMetrics, AdminDashboardPage(), buildDashboardCards(), buildDashboardTasks(), cx() (+19 more)

### Community 40 - "superadmin/validation.ts"
Cohesion: 0.15
Nodes (23): UnitCodePreview(), formatSbgCode(), isCanonicalSbgCode(), extractUnitNumber(), formatUnitCode(), getProvinceRegionCode(), INDONESIA_PROVINCES, IndonesiaProvince (+15 more)

### Community 41 - "admin-blacklist.service.ts"
Cohesion: 0.09
Nodes (34): GET(), Context, GET(), GET(), Page(), Page(), SuperAdminBlacklistPage(), hasCountedBlacklistViolations() (+26 more)

### Community 42 - "buyer.service.ts"
Cohesion: 0.13
Nodes (24): Context, GET(), Page(), BuyerReadOptions, BuyerShellSummary, ensureCanSettleBuyerTransaction(), getActiveBlacklist(), getActiveVickreyBidLock() (+16 more)

### Community 43 - "MarketingFeedRow"
Cohesion: 0.13
Nodes (28): AdminMarketingUnifiedPage(), FixedPriceCard(), FixedPriceProgressPanel(), getAuctionFailureReason(), getFixedPriceOperationalNote(), getFixedPriceVisibleBuyerName(), getFixedPriceWorkflowStatus(), getMarketingAction() (+20 more)

### Community 44 - "superadmin-unit-barang-detail-page.tsx"
Cohesion: 0.11
Nodes (18): getCachedSuperAdminUnitBarangDetail, Page(), DeferredSuperAdminMarketingAudit(), MarketingAuditPanel, SuperAdminMarketingReceiptContext, SuperAdminUnitBarangDetail, SuperAdminUnitBarangItem, SuperAdminUnitBarangMarketingSession (+10 more)

### Community 45 - "admin-redeem-form.tsx"
Cohesion: 0.13
Nodes (18): addDays(), AdminDatePicker(), CalendarPosition, dayNames, formatDisplayDate(), getDateAfter(), monthNames, parseIsoDate() (+10 more)

### Community 46 - "buyer.ts"
Cohesion: 0.09
Nodes (22): BuyerBankAccount, BuyerBid, BuyerBidStatus, BuyerHandoverProof, BuyerPaymentMethod, BuyerTransaction, BuyerTransactionKind, BuyerTransactionStatus (+14 more)

### Community 47 - "session.ts"
Cohesion: 0.17
Nodes (19): AdminNotificationsRoute(), Page(), getCachedSuperAdminMonitoring, Page(), Page(), Page(), SuperAdminDashboardPage(), TransactionsPage() (+11 more)

### Community 48 - "lib/auth.ts"
Cohesion: 0.19
Nodes (16): { GET, POST, PUT, PATCH, DELETE }, auth, BuyerLoginPayload, BuyerRegisterPayload, normalizeBuyerEmail(), normalizeBuyerNationalId(), normalizeBuyerPhoneNumber(), validateBuyerEmail() (+8 more)

### Community 49 - "dependencies"
Cohesion: 0.08
Nodes (25): better-auth, @better-auth/drizzle-adapter, class-variance-authority, clsx, dotenv, drizzle-orm, html2canvas, lucide-react (+17 more)

### Community 50 - "admin-blacklist-detail-workspace.tsx"
Cohesion: 0.14
Nodes (21): AdminBlacklistDetailWorkspace(), AdminBlacklistItem, AuctionDetailPanel(), clampLevel(), formatDisplayDate(), formatDisplayDateTime(), formatMoney(), getCurrentLevel() (+13 more)

### Community 51 - "refreshBuyerAuctionSettlementState"
Cohesion: 0.13
Nodes (13): GET(), GET(), Page(), Page(), getBuyerBlacklistInfo(), getBuyerDashboardData(), getBuyerProfileSummary(), getBuyerShellSummary() (+5 more)

### Community 52 - "categories.ts"
Cohesion: 0.12
Nodes (20): categoryMap, LotFigureProps, ADMIN_UNIT_CATEGORY_FILTER_OPTIONS, ADMIN_UNIT_CATEGORY_OPTIONS, AdminUnitCategory, AdminUnitCategoryIconKey, buildCategoryHaystack(), CATEGORY_LABEL_BY_VALUE (+12 more)

### Community 53 - "renewed-cross-unit-violation-scenario.ts"
Cohesion: 0.15
Nodes (20): assert(), getRenewedExpectedFinalRestrictions(), getRenewedScenarioDurationHours(), RENEWED_CROSS_UNIT_EMAILS, RENEWED_CROSS_UNIT_IDENTITIES, RENEWED_CROSS_UNIT_VIOLATION_SCENARIO, RenewedCrossUnitEmail, RenewedCrossUnitViolationIncident (+12 more)

### Community 54 - "notification-events.ts"
Cohesion: 0.21
Nodes (22): getBuyerLoserAnnouncementHref(), buyerBlacklistEntityId(), createForUsers(), getSuperAdminIterationHref(), notifyAdminUnitBidSubmitted(), notifyAdminUnitPaymentProofUploaded(), notifyAdminUnitVickreyResult(), notifyBlacklistActivated() (+14 more)

### Community 55 - "unit-admin-audit-repair.ts"
Cohesion: 0.14
Nodes (20): getUnitAdminAuditRepairContext(), listUnitAdminAuditRepairCandidates(), QueryResult, repairUnitAdminAuditTrail(), UNIT_ADMIN_AUDIT_REPAIR_CANDIDATES_SQL, UNIT_ADMIN_AUDIT_REPAIR_CONTEXT_SQL, UnitAdminAuditRepairCandidate, UnitAdminAuditRepairClient (+12 more)

### Community 56 - "apply-cross-unit-violation-scenario.ts"
Cohesion: 0.12
Nodes (23): applyChanges, assertCount(), assertExactScopedIds(), auditScenario(), Column, insertRows(), insertScenario(), LoadedSeedContext (+15 more)

### Community 57 - "rekening-unit.service.ts"
Cohesion: 0.19
Nodes (17): DELETE(), PUT(), toErrorResponse(), GET(), POST(), toErrorResponse(), isBlacklistRestrictionActive(), createUnitAccount() (+9 more)

### Community 58 - "role-notifications-panel.tsx"
Cohesion: 0.15
Nodes (18): AdminUnitNotificationsPage(), AdminUnitNotificationsPageProps, AdminPageHero(), AdminPageHeroProps, formatNotificationDateTime(), getMetadataTimestamp(), getNotificationDisplayTimestamp(), getNotificationTone() (+10 more)

### Community 59 - "build_kuesioner_uat.py"
Cohesion: 0.30
Nodes (22): add_callout(), add_footer(), add_heading(), add_label_value_table(), add_question_table(), add_response_lines(), add_scale_table(), add_scenario_table() (+14 more)

### Community 60 - "admin-unit/validation.ts"
Cohesion: 0.21
Nodes (21): normalizeCustomerNumber(), AdminBarangMediaInput, ALLOWED_CATEGORIES, ALLOWED_CONDITIONS, ALLOWED_MEDIA_TYPES, normalizeDate(), normalizeDueAt(), normalizeMoney() (+13 more)

### Community 61 - "buyer-top-nav.tsx"
Cohesion: 0.14
Nodes (17): LoginSuccessTransition(), LogoutSuccessTransition(), LogoutButton(), LogoutButtonProps, AdminProfileMenu(), AdminProfileMenuProps, getInitials(), BuyerProfileMenu() (+9 more)

### Community 62 - "getCountdownState"
Cohesion: 0.17
Nodes (15): AuctionCountdownTiles(), AuctionCountdownTilesProps, parseCountdownSegments(), AuctionLoserRecommendationCountdown(), AuctionLoserRecommendationCountdownProps, LiveCountdown(), LiveCountdownProps, parseCountdownSegments() (+7 more)

### Community 63 - "auction-loser-hero-stage.tsx"
Cohesion: 0.11
Nodes (20): AuctionLoserHeroStage(), AuctionLoserHeroStageProps, BURST_COLORS, BURST_EMITTERS, BURST_PIECES, BurstPiece, BurstVariant, formatFixed() (+12 more)

### Community 64 - "effective-state.ts"
Cohesion: 0.20
Nodes (15): buildLevelThreeLoginSuspensionMessage(), deriveLoginSuspensionState(), getLevelThreeLoginSuspensionMessage(), isLevelThreeLoginSuspensionMessage(), LoginSuspensionBlacklist, LoginSuspensionState, deriveEffectiveBlacklistState(), EffectiveBlacklistState (+7 more)

### Community 65 - "public-catalog.service.ts"
Cohesion: 0.20
Nodes (16): Context, GET(), GET(), Page(), PurchasePage(), serializePublicLot(), fixedPriceCatalogAvailabilityPredicate(), getMediaByBarangId() (+8 more)

### Community 66 - "dashboard-shell.tsx"
Cohesion: 0.16
Nodes (15): isSuperAdminReceiptRoute(), SuperAdminLayout(), clearGlobalThemeSideEffects(), DashboardShell(), DashboardShellProps, NavIconName, NavItem, SidebarMetric (+7 more)

### Community 67 - "catalog.ts"
Cohesion: 0.14
Nodes (13): PurchaseStatus, PurchaseWorkflow(), PurchaseWorkflowProps, LotCard(), LotCardProps, LotFigure(), ReceiptMetaItem, TransactionReceiptDocument() (+5 more)

### Community 68 - "SuperAdminUnitInventorySection"
Cohesion: 0.17
Nodes (21): formatDashboardCount(), formatFullCurrency(), formatUnitDetailCategory(), getSuperAdminIterationHistory(), getSuperAdminMarketingDateLabel(), getSuperAdminMarketingModeLabel(), getSuperAdminMarketingPriceLabel(), getSuperAdminMarketingPriceValue() (+13 more)

### Community 69 - "apply-renewed-cross-unit-violation-scenario.ts"
Cohesion: 0.15
Nodes (20): ids(), getBlacklistDurationUnit(), apply, applyRows(), audit(), blacklistIds, insertRows(), itemIds (+12 more)

### Community 70 - "fixed-price-rejected-relist-repair.ts"
Cohesion: 0.16
Nodes (17): ARCHIVE_MARKETING_SQL, CLEAN_FIXED_PRICE_REJECTION_HISTORY_SQL, DELETE_FIXED_PRICE_RELIST_REPAIR_HISTORY_SQL, FIXED_PRICE_REJECTED_RELIST_CANDIDATES_SQL, FixedPriceRejectedRelistCandidate, INSERT_FIXED_PRICE_RELIST_SYSTEM_HISTORY_SQL, INSERT_NEXT_MARKETING_SQL, KEEP_ITEM_MARKETED_SQL (+9 more)

### Community 71 - "scripts"
Cohesion: 0.10
Nodes (21): scripts, build, db:backfill:blacklist, db:cleanup:obsolete, db:generate, db:migrate:canonical-codes, db:migrate:customer-data-standard, db:migrate:handover-auto-completion (+13 more)

### Community 72 - "requireBuyerApiSession"
Cohesion: 0.16
Nodes (15): POST(), PUT(), Context, POST(), Context, POST(), readProofPayload(), DELETE() (+7 more)

### Community 73 - "alert-center.tsx"
Cohesion: 0.18
Nodes (18): AlertCenter(), AlertCenterProps, formatNotificationDateTime(), getMetadataTimestamp(), getNotificationCenterHref(), getNotificationDisplayTimestamp(), getNotificationIcon(), getPersistedVariant() (+10 more)

### Community 74 - "admin-unit/serializers.ts"
Cohesion: 0.21
Nodes (18): AdminBidRow, AdminPemasaranMedia, AdminPemasaranTransaction, AdminSafeBidRow, BarangRow, formatPaymentMethod(), getBarangNextAction(), PemasaranRow (+10 more)

### Community 75 - "buyer/serializers.ts"
Cohesion: 0.21
Nodes (16): AccountShape, BuyerBidShape, BuyerTransactionShape, formatRupiah(), getBuyerBankAccounts(), getPaymentNotes(), PublicLotShape, serializeBuyerBankAccount() (+8 more)

### Community 76 - "formatAppDateTime"
Cohesion: 0.25
Nodes (12): AdminLayout(), getCachedAdminLayoutMetrics, getCachedAdminLayoutUnit, isAdminReceiptRoute(), getDeviceLabel(), Page(), getDeviceLabel(), Page() (+4 more)

### Community 77 - "public-shell.tsx"
Cohesion: 0.18
Nodes (16): BuyerViewerInput, CachedBuyerViewer, clearBuyerViewerCache(), getSessionStorage(), readBuyerViewerCache(), toCachedBuyerViewer(), writeBuyerViewerCache(), AuthMeResponse (+8 more)

### Community 78 - "admin-dashboard-checklist-card.tsx"
Cohesion: 0.20
Nodes (18): AdminDashboardChecklistCard(), checklistDateFormatter, checklistDateKeyFormatter, checklistTimeFormatter, createStoredChecklist(), DashboardChecklistCardProps, DashboardChecklistTask, formatChecklistDate() (+10 more)

### Community 79 - "dateLabel"
Cohesion: 0.16
Nodes (19): dateLabel(), FixedPriceHandoverProofSection(), formatOptionalCurrency(), getCompactCurrencyTextClass(), getCurrencyDigitCount(), getHighestBidAmount(), getMechanismBadgeTextClass(), getMechanismDateTextClass() (+11 more)

### Community 80 - "auction-loser-page.tsx"
Cohesion: 0.18
Nodes (13): ArrowRightIcon(), CalendarIcon(), ChevronLeftIcon(), ChevronRightIcon(), ClockIcon(), FrownIcon(), GavelIcon(), HeartIcon() (+5 more)

### Community 81 - "superadmin-pages.test.tsx"
Cohesion: 0.11
Nodes (14): formatCompactCurrency(), getCompactUnitName(), getMonitoringChartAxisTicks(), getUnitTypeLabel(), SuperAdminCreateUnitPage(), SuperAdminManagementAdminDetailPage(), SuperAdminManagementPage(), SuperAdminManagementUnitDetailPage() (+6 more)

### Community 82 - "requireSuperAdminApiSession"
Cohesion: 0.21
Nodes (13): Context, POST(), toErrorResponse(), Context, PATCH(), toErrorResponse(), DELETE(), GET() (+5 more)

### Community 83 - "SuperAdminDashboardPage"
Cohesion: 0.14
Nodes (17): buildChartTicks(), clampChartValue(), extractLeadingNumber(), findMetric(), findSnapshot(), findSpotlight(), formatAmountTick(), formatLeaderboardCurrency() (+9 more)

### Community 84 - "createFixedPricePurchase"
Cohesion: 0.14
Nodes (8): Context, POST(), readPurchasePayload(), createFixedPricePurchase(), ensureActiveMarketing(), isFixedPriceLockedByOtherBuyerStatus(), REUSABLE_BUYER_TRANSACTION_STATUSES, mocks

### Community 85 - "buyer-violation-page.tsx"
Cohesion: 0.17
Nodes (13): Page(), BuyerViolationPage(), BuyerViolationPageProps, FeatureRow(), formatCurrency(), getCountdownParts(), numberFormatter, TimelineItem() (+5 more)

### Community 86 - "humanize"
Cohesion: 0.17
Nodes (16): buildMarketingPaymentReference(), FixedPricePaymentVerificationModal(), FixedPriceReceiptInlinePrint(), getFixedPriceReceiptPrintRootId(), getFixedPriceReceiptTerms(), getMarketingCategoryIcon(), getMarketingPaymentMethodLabel(), getMarketingReceiptImageUrl() (+8 more)

### Community 87 - "storage.ts"
Cohesion: 0.29
Nodes (14): safeFileName(), saveAdminBarangMediaFiles(), assertInsideUploads(), assertSafeSegment(), bundledUploadsRoot(), createUploadWriteTarget(), defaultUploadsRoot(), getPublicUploadUrl() (+6 more)

### Community 88 - "components.json"
Cohesion: 0.13
Nodes (14): aliases, components, lib, ui, utils, rsc, $schema, style (+6 more)

### Community 89 - "specifications.ts"
Cohesion: 0.20
Nodes (14): getSpecValue(), getVickreyAssetDetailRows(), isMarketingVideoMedia(), VickreyFailureAssetPanel(), VickreyMediaManifest(), VickreyWinnerAssetPanel(), BarangSpecificationField, BarangSpecificationRecord (+6 more)

### Community 90 - "vickrey-ranking-table.tsx"
Cohesion: 0.16
Nodes (12): getInitials(), PODIUM_AVATAR_TONES, PODIUM_MEDALS, PODIUM_ROW_TONES, RankingAvatar(), RankingRow(), STATUS_STYLES, VickreyRankingRow (+4 more)

### Community 91 - "obsolete-database-cleanup.ts"
Cohesion: 0.20
Nodes (12): LEGACY_REAL_ACCOUNT_ID_REPAIRS, LegacyRealAccountIdRepair, legacyRealAccountRepairValues, OBSOLETE_DATABASE_TABLES, OBSOLETE_DEMO_USER_IDS, obsoleteDemoUserValues, sqlLiteral(), sqlNullable() (+4 more)

### Community 92 - "isVickreyPaymentFulfilled"
Cohesion: 0.23
Nodes (14): getInitials(), getMarketingProgressCompletionLabel(), getMarketingReceiptLockMessage(), getWinnerBid(), isVickreyPaymentFulfilled(), isVickreyPaymentVerified(), VickreyFailureProfilePanel(), VickreyPaymentProgressPanel() (+6 more)

### Community 93 - "SuperAdminVickreyReceiptInlinePrint"
Cohesion: 0.15
Nodes (14): formatSuperAdminDisplayLabel(), getSuperAdminCompactCurrencyTextClass(), getSuperAdminCompletionLabel(), getSuperAdminCurrencyDigitCount(), getSuperAdminMarketingPaymentMethodLabel(), getSuperAdminMarketingReceiptImageUrl(), getSuperAdminVerifiedDetail(), getSuperAdminVickreyReceiptPrintRootId() (+6 more)

### Community 94 - "user-dashboard-page.tsx"
Cohesion: 0.24
Nodes (11): BuyerDashboardViolation, BuyerSummary, getDashboardActionLabel(), getUrgentDashboardCopy(), getUrgentTransactionRank(), isDashboardActiveBid(), isDashboardActiveTransaction(), isDashboardPaymentWaiting() (+3 more)

### Community 96 - "AdminFixedPriceDetailPage"
Cohesion: 0.15
Nodes (12): AdminFixedPriceDetailPage(), AdminFixedPriceListPage(), AdminVickreyAuctionDetailPage(), FAILED_VICKREY_TRANSACTION_STATUSES, FixedPricePaymentVerificationButton(), getFixedPriceAmountClass(), getFixedPriceSpecificationTiles(), getFixedPriceVerificationAction() (+4 more)

### Community 97 - "account-profile.service.ts"
Cohesion: 0.29
Nodes (9): PUT(), PUT(), AccountProfileRole, AccountProfileUpdatePayload, getRoleNotFoundMessage(), normalizeEmail(), readRecord(), updateAccountProfile() (+1 more)

### Community 98 - "uploadAdminTransactionHandoverProof"
Cohesion: 0.20
Nodes (5): Context, POST(), readHandoverProofPayload(), uploadAdminTransactionHandoverProof(), mocks

### Community 99 - "app/layout.tsx"
Cohesion: 0.27
Nodes (6): metadata, metadataBase, siteUrl, UiProviders(), LOCAL_HOSTNAMES, resolvePublicSiteUrl()

### Community 100 - "AdminVickreyAuctionListPage"
Cohesion: 0.21
Nodes (12): AdminVickreyAuctionListPage(), FixedPriceAuditGallery(), fixedPriceMediaLabel(), getFixedPriceCatalogStatusMeta(), getMarketingCompletionLabel(), getMarketingVerifiedDetail(), getVickreyStage(), getVickreyWinnerWorkspaceHref() (+4 more)

### Community 101 - "BuyerSessionUser"
Cohesion: 0.27
Nodes (8): getCachedBuyerShellSummary, isBuyerReceiptRoute(), UserLayout(), BuyerShell(), BuyerShellProps, BuyerSessionUser, requireBuyerSession(), navigationMock

### Community 102 - "transaction-links.ts"
Cohesion: 0.38
Nodes (7): Page(), Page(), AuctionWinnerPage(), getBuyerBidTransactionHref(), getBuyerTransactionHref(), getBuyerWinnerAnnouncementHref(), isBuyerWinnerAnnouncementTransaction()

### Community 103 - "notifications-page.tsx"
Cohesion: 0.27
Nodes (9): BuyerNotificationsPage(), BuyerNotificationsPageProps, formatNotificationDateTime(), getMetadataTimestamp(), getNotificationDisplayTimestamp(), getNotificationTone(), NotificationFilter, NotificationTone (+1 more)

### Community 104 - "lot-realtime-stats.tsx"
Cohesion: 0.25
Nodes (9): EMPTY_STATS, formatCount(), getBrowserViewerKey(), LotRealtimeStats(), LotRealtimeStatsProps, normalizeStats(), StatItem, AuctionMode (+1 more)

### Community 105 - "report-range-dropdown.tsx"
Cohesion: 0.29
Nodes (10): buildCalendarDays(), dayNames, formatShortDate(), monthNames, normalizeRange(), parseIsoDate(), ReportCustomRange, ReportRangeDropdown() (+2 more)

### Community 106 - "buyer/validation.ts"
Cohesion: 0.33
Nodes (9): BuyerBidPayload, BuyerPaymentProofPayload, BuyerProfileUpdatePayload, BuyerPurchasePayload, readRecord(), validateBuyerBidPayload(), validateBuyerPaymentProofPayload(), validateBuyerProfileUpdatePayload() (+1 more)

### Community 107 - "package.json"
Cohesion: 0.18
Nodes (10): browserslist, name, private, version, Chrome >= 111, ChromeAndroid >= 111, Edge >= 111, Firefox >= 111 (+2 more)

### Community 108 - "stats/route.ts"
Cohesion: 0.31
Nodes (7): GET(), getAnonymousViewerKey(), normalizeViewerKey(), POST(), getLotStats(), recordLotView(), mocks

### Community 109 - "submitVickreyBid"
Cohesion: 0.22
Nodes (4): Context, POST(), submitVickreyBid(), mocks

### Community 110 - "syncBuyerRestrictionNotifications"
Cohesion: 0.36
Nodes (7): GET(), GET(), Page(), ensureVickreyLossNotifications(), getBuyerRestrictionSnapshot(), syncBuyerRestrictionNotifications(), getUnreadNotificationCount()

### Community 111 - "transaction-receipt-page.test.tsx"
Cohesion: 0.29
Nodes (8): createReceiptPdf(), TransactionReceiptAutoPrint(), waitForReceiptAssets(), jspdf, jspdf, buyer, transaction, vickreyTransaction

### Community 112 - "transaction-receipt-inline-print.tsx"
Cohesion: 0.40
Nodes (9): disableReceiptPrintMode(), enableReceiptPrintMode(), isJsdomRuntime(), printReceiptElementInIsolatedFrame(), shouldUseIsolatedReceiptPrintFrame(), syncReceiptPrintFrameHead(), TransactionReceiptInlinePrint(), TransactionReceiptInlinePrintProps (+1 more)

### Community 113 - "admin-blacklist-service.test.ts"
Cohesion: 0.27
Nodes (9): globalBlacklistRow(), globalFacts, installDatabaseScenario(), L1_OCCURRED_AT, L2_OCCURRED_AT, L3_OCCURRED_AT, localTraceRow(), mocks (+1 more)

### Community 114 - "[...path]/route.ts"
Cohesion: 0.43
Nodes (7): Context, GET(), getUploadResponse(), HEAD(), parseByteRange(), toWebStream(), getUploadMimeType()

### Community 115 - "detail-favorite-toggle.tsx"
Cohesion: 0.32
Nodes (5): DetailFavoriteToggle(), DetailFavoriteToggleProps, FavoriteToggleButton(), FavoriteToggleButtonProps, router

### Community 116 - "guards.ts"
Cohesion: 0.36
Nodes (5): AppSessionUser, getSafeAdminNextPath(), getSafeSuperAdminNextPath(), ROLE_ALLOWED_PREFIXES, ROLE_HOME_PATHS

### Community 117 - "backfill-blacklist-violation-totals.ts"
Cohesion: 0.32
Nodes (7): applyChanges, BackfillRow, BlacklistRow, formatRow(), main(), sameInstant(), ViolationRow

### Community 120 - "katalog/[id]/page.tsx"
Cohesion: 0.38
Nodes (4): Page(), getBuyerBidState(), isBuyerWishlistItem(), mocks

### Community 121 - "admin-barang-detail-media-viewer.tsx"
Cohesion: 0.52
Nodes (5): AdminBarangDetailMediaViewer(), DetailMedia, getInitialIndex(), getMediaName(), isVideoMedia()

### Community 122 - "buyer-vickrey-pages.test.tsx"
Cohesion: 0.29
Nodes (6): BidPage(), AuctionLoserPage(), buyer, fixedPriceLot, vickreyLot, winningBid

### Community 123 - "lot-media-gallery.tsx"
Cohesion: 0.43
Nodes (4): getInitialIndex(), LotMediaGallery(), LotMediaItem, mediaLabel()

### Community 124 - "catalog-page.test.tsx"
Cohesion: 0.40
Nodes (3): CatalogHero(), HeroInfoCard(), router

### Community 125 - "marketing-performance-panel.tsx"
Cohesion: 0.47
Nodes (4): EMPTY_INSIGHTS, MarketingPerformanceMetricCard(), MarketingPerformancePanel(), normalizeInsights()

### Community 126 - "fixed-price-visibility.ts"
Cohesion: 0.60
Nodes (4): FIXED_PRICE_BUYER_CATALOG_HIDDEN_STATUSES, FIXED_PRICE_TRANSACTION_CATALOG_HIDDEN_STATUSES, isFixedPriceBuyerCatalogHiddenStatus(), isFixedPriceTransactionCatalogHiddenStatus()

### Community 127 - "wishlist.ts"
Cohesion: 0.40
Nodes (3): BuyerWishlist, BuyerWishlistItem, router

### Community 128 - "apply-handover-proof-migration.ts"
Cohesion: 0.40
Nodes (3): describeTarget(), dryRun, main()

### Community 129 - "render_plantuml_online.py"
Cohesion: 0.60
Nodes (4): append3bytes(), encode6bit(), plantuml_encode(), Render a local PlantUML source through the official PlantUML PNG endpoint.

### Community 130 - "eslint.config.mjs"
Cohesion: 0.40
Nodes (4): compat, config, __dirname, __filename

### Community 131 - "marketing-edit-policy.ts"
Cohesion: 0.60
Nodes (3): canEditMarketedBarang(), MarketingEditContext, normalize()

### Community 132 - "remove-handover-complaint.ts"
Cohesion: 0.50
Nodes (3): describeTarget(), dryRun, main()

### Community 133 - "apply-canonical-codes-migration.ts"
Cohesion: 0.50
Nodes (4): describeTarget(), dryRun, main(), migrationUrl

### Community 134 - "apply-customer-data-standard-migration.ts"
Cohesion: 0.50
Nodes (4): describeTarget(), dryRun, main(), migrationUrl

### Community 138 - "apply-handover-auto-completion-migration.ts"
Cohesion: 0.67
Nodes (3): describeTarget(), dryRun, main()

### Community 139 - "notification-routes.test.ts"
Cohesion: 0.50
Nodes (3): adminAccess, buyerAccess, mocks

## Knowledge Gaps
- **779 isolated node(s):** `metadata`, `metadata`, `Context`, `Context`, `Context` (+774 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `admin-inventory-workspace.tsx`, `superadmin-pages.tsx`, `user-pages.tsx`, `unit-form.tsx`, `admin-transaction-pages.tsx`, `toast.tsx`, `admin-pages.tsx`, `compact-transaction-progress.tsx`, `admin-marketing-pages.tsx`, `admin-dashboard.service.ts`, `superadmin-account-workspace.tsx`, `admin-barang-edit-form.tsx`, `wishlist-page.tsx`, `catalog-page.tsx`, `superadmin-blacklist-detail-workspace.tsx`, `public-pages.tsx`, `profile-settings-form.tsx`, `transactions-workspace.tsx`, `button.tsx`, `MarketingFeedRow`, `superadmin-unit-barang-detail-page.tsx`, `admin-redeem-form.tsx`, `admin-blacklist-detail-workspace.tsx`, `categories.ts`, `role-notifications-panel.tsx`, `buyer-top-nav.tsx`, `getCountdownState`, `dashboard-shell.tsx`, `catalog.ts`, `SuperAdminUnitInventorySection`, `alert-center.tsx`, `public-shell.tsx`, `admin-dashboard-checklist-card.tsx`, `superadmin-pages.test.tsx`, `buyer-violation-page.tsx`, `humanize`, `vickrey-ranking-table.tsx`, `SuperAdminVickreyReceiptInlinePrint`, `user-dashboard-page.tsx`, `AdminFixedPriceDetailPage`, `BuyerSessionUser`, `notifications-page.tsx`, `lot-realtime-stats.tsx`, `report-range-dropdown.tsx`, `transaction-receipt-inline-print.tsx`, `detail-favorite-toggle.tsx`, `help-center-page.tsx`, `admin-barang-detail-media-viewer.tsx`, `lot-media-gallery.tsx`, `catalog-page.test.tsx`, `marketing-performance-panel.tsx`?**
  _High betweenness centrality (0.150) - this node is a cross-community bridge._
- **Why does `client` connect `apply-renewed-cross-unit-violation-scenario.ts` to `apply-handover-proof-migration.ts`, `remove-handover-complaint.ts`, `apply-canonical-codes-migration.ts`, `apply-customer-data-standard-migration.ts`, `fixed-price-rejected-relist-repair.ts`, `apply-handover-auto-completion-migration.ts`, `start-production.mjs`, `unit-admin-audit-repair.ts`, `apply-cross-unit-violation-scenario.ts`, `obsolete-database-cleanup.ts`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Why does `formatAppDateTime()` connect `formatAppDateTime` to `admin-barang.service.ts`, `superadmin-pages.tsx`, `mock-data.ts`, `wishlist.service.ts`, `admin-marketing-pages.tsx`, `cron.service.ts`, `wishlist-page.tsx`, `catalog-page.tsx`, `public-pages.tsx`, `transactions-workspace.tsx`, `formatSuperAdminDateTime`, `admin-blacklist.service.ts`, `buyer.service.ts`, `refreshBuyerAuctionSettlementState`, `notification-events.ts`, `effective-state.ts`, `admin-unit/serializers.ts`, `buyer/serializers.ts`, `dateLabel`, `auction-loser-page.tsx`, `humanize`, `syncBuyerRestrictionNotifications`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **What connects `metadata`, `metadata`, `Context` to the rest of the system?**
  _779 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `admin-pages.lazy.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.044564890093345376 - nodes in this community are weakly interconnected._
- **Should `admin-barang.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05333333333333334 - nodes in this community are weakly interconnected._
- **Should `admin-inventory-workspace.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05368421052631579 - nodes in this community are weakly interconnected._