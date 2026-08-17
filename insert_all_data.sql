-- ==========================================================
-- 📈 WealthPulse: Insert All Initial Data into Supabase Tables
-- ==========================================================

-- 1. Insert Users
INSERT INTO public.wealthpulse_users (id, name, email, password_hash, mpin_hash, created_at)
VALUES ('usr_1785755811844_crbzz5', 'Venkatamani Sasank Tadepalli', 'venkatamanishashankt@gmail.com', '$2b$10$jS44iODEb/WqZJ/QlbLfjOmjU5ejlER56FKtgKKAldgvoMbUkhunu', '$2b$10$Qvdcz.x0DXxyKqy7IoWrgOoxTVSz2oWz1VhlCmngzM5Fk0rOM9LFe', '2026-08-03T11:16:51.908Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.wealthpulse_users (id, name, email, password_hash, mpin_hash, created_at)
VALUES ('usr_1786096317198_khugec', 'Lalitha Ayyagari', 'lalithaayyagari29@gmail.com', '$2b$10$BmJ0ttKO4fPNdhWQNTqTJeceRs0Rw4uNiSxUpazAOQLqxJEnPSNte', NULL, '2026-08-07T09:51:57.287Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.wealthpulse_users (id, name, email, password_hash, mpin_hash, created_at)
VALUES ('usr_1786099954942_r95sps', 'Lakshmi Prasanna Nunna', 'nunnalakshmiprasanna@gmail.com', '$2b$10$8bj8nLX9yeUBX8zTDwcjKeGEgJp3czMGz3av9qdcw31vKU.yGtNmy', NULL, '2026-08-07T10:52:35.027Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.wealthpulse_users (id, name, email, password_hash, mpin_hash, created_at)
VALUES ('usr_1786100101409_htdan4', 'Prasanna Lakshmi Nunna', 'lakshmipnunna@gmail.com', '$2b$10$ySNKAYZgIJdm/P4fCui2uuQ6FdoSZjb1a8QRyHJoiIzn41guZ4fb2', NULL, '2026-08-07T10:55:01.480Z')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Transactions
INSERT INTO public.wealthpulse_transactions (id, user_id, date, merchant, amount, type, category, account, tags, created_at)
VALUES ('tx_1785818900000_isroexam', 'usr_1785755811844_crbzz5', '2026-08-05', 'ISRO Exam', 500, 'expense', 'Exams', 'HDFC Account', '["Personal"]', '2026-08-05T04:45:00.000Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.wealthpulse_transactions (id, user_id, date, merchant, amount, type, category, account, tags, created_at)
VALUES ('tx_1785818160348_2fkoulo4i', 'usr_1785755811844_crbzz5', '2026-08-04', 'HMWSSB', 600, 'expense', 'Utilities', 'HDFC Account', '["Water tanker"]', '2026-08-04T04:36:00.348Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.wealthpulse_transactions (id, user_id, date, merchant, amount, type, category, account, tags, created_at)
VALUES ('tx_1785817210490_kg7gu5faq', 'usr_1785755811844_crbzz5', '2026-08-04', 'Tiffins (Swathi hotel jpts)', 80, 'expense', 'Dining', 'HDFC Account', '["Tiffins"]', '2026-08-04T04:20:10.490Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.wealthpulse_transactions (id, user_id, date, merchant, amount, type, category, account, tags, created_at)
VALUES ('tx_1785750352806_ct7hmvvqk', 'usr_1785755811844_crbzz5', '2026-08-03', 'Parivaahan LLR Telangana', 570.36, 'expense', 'Transportation', 'HDFC Account', '["Personal"]', '2026-08-03T09:45:52.806Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.wealthpulse_transactions (id, user_id, date, merchant, amount, type, category, account, tags, created_at)
VALUES ('tx_1785750308622_ufcju15fo', 'usr_1785755811844_crbzz5', '2026-08-03', 'AWS (Monthly Payment SAE)', 63.13, 'expense', 'Utilities', 'HDFC Account', '["Services"]', '2026-08-03T09:45:08.622Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.wealthpulse_transactions (id, user_id, date, merchant, amount, type, category, account, tags, created_at)
VALUES ('tx_1785750244243_v0f4q87a5', 'usr_1785755811844_crbzz5', '2026-08-02', 'Coriander', 10, 'expense', 'Groceries', 'HDFC Account', '["home"]', '2026-08-03T09:44:04.243Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.wealthpulse_transactions (id, user_id, date, merchant, amount, type, category, account, tags, created_at)
VALUES ('tx_1785750184243_genprov01', 'usr_1785755811844_crbzz5', '2026-08-01', 'General Provision (BRU Packets)', 20, 'expense', 'Groceries', 'HDFC Account', '["home"]', '2026-08-03T09:43:04.243Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.wealthpulse_transactions (id, user_id, date, merchant, amount, type, category, account, tags, created_at)
VALUES ('tx_1785750124243_kassdiner01', 'usr_1785755811844_crbzz5', '2026-07-31', 'Dinner at Hotel KASS (Office)', 477, 'expense', 'Dining', 'HDFC Account', '["Office"]', '2026-08-03T09:42:04.243Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.wealthpulse_transactions (id, user_id, date, merchant, amount, type, category, account, tags, created_at)
VALUES ('tx_1785749969071_icfaisalary', 'usr_1785755811844_crbzz5', '2026-07-31', 'SALARIES THE ICFAI FOUNDATION FOR HIGHEREDUCATION', 23803, 'income', 'Income', 'HDFC Account', '["Salary"]', '2026-08-03T09:39:29.071Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.wealthpulse_transactions (id, user_id, date, merchant, amount, type, category, account, tags, created_at)
VALUES ('tx_1786077132637_3wlhos71f', 'usr_1785755811844_crbzz5', '2026-08-06', 'Phone Screen Guards', 600, 'expense', 'Entertainment', 'HDFC Account', '["Personal"]', '2026-08-07T04:32:12.637Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.wealthpulse_transactions (id, user_id, date, merchant, amount, type, category, account, tags, created_at)
VALUES ('tx_1786077175747_gzgwsis8h', 'usr_1785755811844_crbzz5', '2026-08-06', 'Auto to Home from Habsiguda', 155, 'expense', 'Transportation', 'HDFC Account', '["Personal"]', '2026-08-07T04:32:55.747Z')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Stock & Mutual Fund Investments
INSERT INTO public.wealthpulse_investments (id, user_id, name, symbol, type, quantity, buy_price, current_price, current_valuation, unrealized_pnl, pnl_percentage, created_at)
VALUES ('inv_1786007326649_yzzipl', 'usr_1785755811844_crbzz5', 'Parag Parikh Flexi Cap Fund ( Growth | Equity - Flexi Cap )', '122639', 'mutual_fund', 270.602, 92.38, 91.6834, 24809.71, -188.5, -0.75, '2026-08-06T09:08:46.650Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.wealthpulse_investments (id, user_id, name, symbol, type, quantity, buy_price, current_price, current_valuation, unrealized_pnl, pnl_percentage, created_at)
VALUES ('inv_1786007547082_bsd4ii', 'usr_1785755811844_crbzz5', 'Nippon Inida Multi Asset Allocation Fund ( Direct | Growth | Hybrid - Multi Asset Allocation )', '148457', 'mutual_fund', 964.703, 25.91, 27.487, 26516.79, 1521.34, 6.09, '2026-08-06T09:12:27.082Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.wealthpulse_investments (id, user_id, name, symbol, type, quantity, buy_price, current_price, current_valuation, unrealized_pnl, pnl_percentage, created_at)
VALUES ('inv_1786009340816_80lfez', 'usr_1785755811844_crbzz5', 'BAJAJHFL', 'BAJAJHFL.NS', 'stock', 14, 107.19, 83.95, 1175.3, -325.36, -21.68, '2026-08-06T09:42:20.816Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.wealthpulse_investments (id, user_id, name, symbol, type, quantity, buy_price, current_price, current_valuation, unrealized_pnl, pnl_percentage, created_at)
VALUES ('inv_1786009517335_67nt18', 'usr_1785755811844_crbzz5', 'DEBIL', 'DBEIL.NS', 'stock', 10, 9.42, 6.85, 68.5, -25.7, -27.28, '2026-08-06T09:45:17.335Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.wealthpulse_investments (id, user_id, name, symbol, type, quantity, buy_price, current_price, current_valuation, unrealized_pnl, pnl_percentage, created_at)
VALUES ('inv_1786009572245_nknwut', 'usr_1785755811844_crbzz5', 'GLAND', 'GLAND.NS', 'stock', 5, 919, 2968, 14840, 10245, 222.96, '2026-08-06T09:46:12.245Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.wealthpulse_investments (id, user_id, name, symbol, type, quantity, buy_price, current_price, current_valuation, unrealized_pnl, pnl_percentage, created_at)
VALUES ('inv_1786009695487_vjrjl6', 'usr_1785755811844_crbzz5', 'INFY', 'INFY.NS', 'stock', 1, 1208.7, 1151.9, 1151.9, -56.8, -4.7, '2026-08-06T09:48:15.487Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.wealthpulse_investments (id, user_id, name, symbol, type, quantity, buy_price, current_price, current_valuation, unrealized_pnl, pnl_percentage, created_at)
VALUES ('inv_1786009740060_g54xv8', 'usr_1785755811844_crbzz5', 'IRFC', 'IRFC.NS', 'stock', 58, 27.5, 86.72, 5029.76, 3434.76, 215.35, '2026-08-06T09:49:00.061Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.wealthpulse_investments (id, user_id, name, symbol, type, quantity, buy_price, current_price, current_valuation, unrealized_pnl, pnl_percentage, created_at)
VALUES ('inv_1786009761172_85yn0v', 'usr_1785755811844_crbzz5', 'JIOFIN', 'JIOFIN.NS', 'stock', 5, 310.45, 246.75, 1233.75, -318.5, -20.52, '2026-08-06T09:49:21.172Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.wealthpulse_investments (id, user_id, name, symbol, type, quantity, buy_price, current_price, current_valuation, unrealized_pnl, pnl_percentage, created_at)
VALUES ('inv_1786009786157_eu1unx', 'usr_1785755811844_crbzz5', 'LAURUSLABS', 'LAURUSLABS.NS', 'stock', 34, 516.3, 1818.7, 61835.8, 44281.6, 252.26, '2026-08-06T09:49:46.157Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.wealthpulse_investments (id, user_id, name, symbol, type, quantity, buy_price, current_price, current_valuation, unrealized_pnl, pnl_percentage, created_at)
VALUES ('inv_1786009807825_pil7i9', 'usr_1785755811844_crbzz5', 'OLAELEC', 'OLAELEC.NS', 'stock', 36, 42.5, 38.88, 1399.68, -130.32, -8.52, '2026-08-06T09:50:07.825Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.wealthpulse_investments (id, user_id, name, symbol, type, quantity, buy_price, current_price, current_valuation, unrealized_pnl, pnl_percentage, created_at)
VALUES ('inv_1786009827253_deqeiz', 'usr_1785755811844_crbzz5', 'TMCV', 'TATAMOTORS.NS', 'stock', 16, 251.44, 251.44, 4023.04, 0, 0, '2026-08-06T09:50:27.253Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.wealthpulse_investments (id, user_id, name, symbol, type, quantity, buy_price, current_price, current_valuation, unrealized_pnl, pnl_percentage, created_at)
VALUES ('inv_1786009841805_rt6mp3', 'usr_1785755811844_crbzz5', 'TMPV', 'TATAMOTORS.NS', 'stock', 10, 276.96, 344.9, 3449, 679.4, 24.53, '2026-08-06T09:50:41.805Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.wealthpulse_investments (id, user_id, name, symbol, type, quantity, buy_price, current_price, current_valuation, unrealized_pnl, pnl_percentage, created_at)
VALUES ('inv_1786009851200_0fwodf', 'usr_1785755811844_crbzz5', 'WIPRO', 'WIPRO.NS', 'stock', 16, 235, 181.79, 2908.64, -851.36, -22.64, '2026-08-06T09:50:51.200Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.wealthpulse_investments (id, user_id, name, symbol, type, quantity, buy_price, current_price, current_valuation, unrealized_pnl, pnl_percentage, created_at)
VALUES ('inv_1786085620993_mfj34t', 'usr_1785755811844_crbzz5', 'DEBIL', 'DBEIL.NS', 'stock', 110, 8.68, 6.85, 753.5, -201.3, -21.08, '2026-08-07T06:53:40.993Z')
ON CONFLICT (id) DO NOTHING;
