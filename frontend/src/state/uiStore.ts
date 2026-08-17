import { create } from 'zustand';

type Language = 'en' | 'pt' | 'es' | 'fr' | 'de' | 'ru' | 'hi' | 'zh';

interface UIState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  // --- INGLÊS (BASE) ---
  en: {
    // --- HOME & HERO ---
    hero_pre: "THE FUTURE OF", 
    hero_line1: "CRYPTO", 
    hero_line2: "GAMING",
    hero_subtitle: "Instant payouts, fair gameplay, and a transparent house edge. Your wallet and network stay behind the scenes.",
    hero_description: "Play Originals, follow live sports markets and keep one simple USDC balance. Connect once and let the platform handle the complexity.",
    home_open_sports: "OPEN SPORTSBOOK", home_open_casino: "EXPLORE CASINO", home_originals: "Original games", home_currency: "Accounting unit", home_play_anytime: "Play anytime",
    home_account: "YOUR ACCOUNT", home_ready: "Ready when you are", home_account_link: "Account", home_authenticated: "Your account is ready to play.", home_sign_to_continue: "Sign the message in your wallet to continue.", home_connect_to_start: "Connect once, then deposit and play.",
    home_step_connect: "Connect", home_step_deposit: "Deposit", home_step_play: "Play", home_games_kicker: "CASINO ORIGINALS", home_games_title: "Pick your game", home_view_all: "View all games",
    home_sports_title: "Markets move. Be ready.", home_sports_description: "Explore the Sportsbook foundation with live-ready markets, singles and accumulators.", home_browse_markets: "Browse markets", home_fairness_kicker: "VERIFIABLE PLAY", home_fairness_title: "Fair by design", home_fairness_description: "Every completed game carries a server-side fairness proof that can be independently replayed.", home_account_kicker: "PLAYER HUB", home_account_title: "Your history, your preferences", home_account_description: "Manage your profile, favourites and bet history from one secure account.", home_open_account: "Open account",
    game_crash: "CRASH", desc_crash: "Ride the multiplier", game_limbo: "LIMBO", desc_limbo: "Set your target", game_blackjack: "BLACKJACK", desc_blackjack: "Beat the dealer", home_fair_badge: "Provably fair", home_sports_label: "Sportsbook", home_account_label: "PLAYER HUB",
    
    // --- GAME TITLES & DESC ---
    game_coinflip: "COINFLIP", desc_coinflip: "Double your USDC instantly",
    game_dice: "DICE", desc_dice: "Roll & Win Big",
    game_roulette: "ROULETTE", desc_roulette: "Spin the Wheel",
    game_plinko: "PLINKO", desc_plinko: "Drop & Multiply",
    game_mines: "MINES", desc_mines: "Strategic Sweeper",

    // --- GLOBAL UI & CONTROLS ---
    modal_low_balance: "Insufficient Balance", 
    win: "YOU WON", lose: "YOU LOST",
    btn_cashout: "CASHOUT", btn_play: "PLAY",
    how_to_play: "HOW TO PLAY",
    bankroll_label: "BANKROLL", balance_label: "BALANCE",
    
    lbl_sol_mode: "USDC MODE", lbl_usd_mode: "USD MODE",
    lbl_bet_amount: "BET AMOUNT", lbl_profit: "PROFIT",
    btn_deposit: "DEPOSIT", btn_withdraw: "WITHDRAW",
    
    // --- AUTH & WALLET (NOVOS) ---
    msg_auth_sign: "Please sign the message to verify ownership.",
    msg_auth_success: "Login successful!",
    msg_auth_error: "Authentication failed. Try again.",
    msg_auth_loading: "Verifying wallet...",

    // --- MODAL & WALLET MESSAGES ---
    modal_deposit_title: "DEPOSIT USDC",
    modal_withdraw_title: "WITHDRAW USDC",
    modal_amount_sol: "AMOUNT (USDC)",
    lbl_available: "Available",
    lbl_target_address: "TARGET ADDRESS",
    modal_devnet_warning: "Deposits are currently in preparation. Use test balances only.",
    msg_tx_confirm: "Transaction confirmed.",
    msg_dep_success: "Deposit successful!",
    msg_wit_success: "Withdrawal processing...",
    msg_wit_low_balance: "Insufficient in-game balance for withdrawal.",
    msg_error_connect: "Network or Wallet error. Check console.",
    
    // --- ROULETTE SPECIFIC ---
    instr_roulette: "Bet on Red, Black, or specific numbers. Watch the wheel spin and win big.",
    lbl_chip_value: "CHIP VALUE", lbl_total_bet: "TOTAL BET",
    btn_clear: "CLEAR", btn_spin: "SPIN", btn_spinning: "SPINNING...",
    lbl_red: "RED", lbl_black: "BLACK", lbl_zero: "ZERO",

    // --- DICE SPECIFIC ---
    instr_dice: "Predict the roll result. Use the slider to adjust your win chance and multiplier.",
    lbl_multiplier: "MULTIPLIER", lbl_win_chance: "WIN CHANCE", lbl_edge: "HOUSE EDGE",
    btn_roll_under: "ROLL UNDER", btn_roll_over: "ROLL OVER", btn_roll: "ROLL", btn_rolling: "ROLLING...",
    
    // --- MINES SPECIFIC ---
    lbl_mines: "MINES COUNT",
    instr_mines: "Reveal gems to increase your multiplier. Avoid the mines! Cashout at any time.",
    modal_bomb_msg: "BOOM! You hit a mine.",
    
    // --- COINFLIP SPECIFIC ---
    lbl_select_side: "SELECT SIDE", lbl_heads: "HEADS", lbl_tails: "TAILS",
    btn_flip: "FLIP", btn_flipping: "FLIPPING...",
    instr_coin: "Pick Heads or Tails. Double your money with a 50/50 chance!",
    
    // --- PLINKO SPECIFIC ---
    lbl_risk: "RISK LEVEL", lbl_rows: "ROWS", 
    lbl_low: "LOW", lbl_medium: "MEDIUM", lbl_high: "HIGH",
    btn_drop: "DROP",
    instr_plinko: "Drop the ball from the top and watch it bounce into high multipliers.",
    
    // Errors
    msg_invalid_amount: "Invalid amount", 
  },

  // --- PORTUGUÊS ---
  pt: {
    hero_pre: "O FUTURO DO", hero_line1: "CRYPTO", hero_line2: "GAMING",
    hero_subtitle: "Pagamentos rápidos, jogo justo e uma vantagem da casa transparente.",
    hero_description: "Joga Originals, acompanha mercados desportivos e mantém um saldo USDC simples. Liga-te uma vez e deixa a plataforma tratar da complexidade.",
    home_open_sports: "ABRIR SPORTSBOOK", home_open_casino: "EXPLORAR CASINO", home_originals: "Jogos originais", home_currency: "Unidade de conta", home_play_anytime: "Joga quando quiseres",
    home_account: "A TUA CONTA", home_ready: "Pronto quando estiveres", home_account_link: "Conta", home_authenticated: "A tua conta está pronta para jogar.", home_sign_to_continue: "Assina a mensagem na carteira para continuar.", home_connect_to_start: "Liga-te uma vez, deposita e joga.",
    home_step_connect: "Ligar", home_step_deposit: "Depositar", home_step_play: "Jogar", home_games_kicker: "ORIGINALS DO CASINO", home_games_title: "Escolhe o teu jogo", home_view_all: "Ver todos",
    home_sports_title: "Os mercados mexem. Está pronto.", home_sports_description: "Explora o Sportsbook com mercados preparados para live, apostas simples e acumuladores.", home_browse_markets: "Ver mercados", home_fairness_kicker: "JOGO VERIFICÁVEL", home_fairness_title: "Justo por design", home_fairness_description: "Cada jogo concluído inclui uma prova de fairness do servidor que pode ser verificada de forma independente.", home_account_kicker: "ÁREA DE JOGADOR", home_account_title: "O teu histórico, as tuas preferências", home_account_description: "Gere o perfil, favoritos e histórico de apostas numa conta segura.", home_open_account: "Abrir conta",
    
    game_coinflip: "MOEDA", desc_coinflip: "Duplica o teu USDC",
    game_dice: "DADOS", desc_dice: "Roda e Ganha",
    game_roulette: "ROLETA", desc_roulette: "Gira a Roda",
    game_plinko: "PLINKO", desc_plinko: "Larga e Multiplica",
    game_mines: "MINAS", desc_mines: "Estratégia Pura",

    modal_low_balance: "Saldo Insuficiente", win: "GANHASTE", lose: "PERDESTE",
    btn_cashout: "LEVANTAR", btn_play: "JOGAR", how_to_play: "COMO JOGAR",
    bankroll_label: "BANCA", balance_label: "SALDO",

    lbl_sol_mode: "MODO USDC", lbl_usd_mode: "MODO USD", lbl_bet_amount: "APOSTA", lbl_profit: "LUCRO",
    btn_deposit: "DEPOSITAR", btn_withdraw: "LEVANTAR",
    
    // --- AUTH NOVOS ---
    msg_auth_sign: "Assine a mensagem para verificar a carteira.",
    msg_auth_success: "Login com sucesso!",
    msg_auth_error: "Autenticação falhou. Tente novamente.",
    msg_auth_loading: "A verificar carteira...",
    
    // --- MODAL & WALLET MESSAGES ---
    modal_deposit_title: "DEPOSITAR USDC",
    modal_withdraw_title: "LEVANTAR USDC",
    modal_amount_sol: "QUANTIDADE (USDC)",
    lbl_available: "Disponível",
    lbl_target_address: "ENDEREÇO DE DESTINO",
    modal_devnet_warning: "Os depósitos estão a ser preparados. Use apenas saldos de teste.",
    msg_tx_confirm: "Transação confirmada.",
    msg_dep_success: "Depósito bem-sucedido!",
    msg_wit_success: "Processando levantamento...",
    msg_wit_low_balance: "Saldo em jogo insuficiente para levantamento.",
    msg_error_connect: "Erro de rede ou carteira. Verifique a consola.",

    instr_roulette: "Aposta no Vermelho, Preto ou números. Gira a roda e ganha!",
    lbl_chip_value: "VALOR FICHA", lbl_total_bet: "TOTAL APOSTA",
    btn_clear: "LIMPAR", btn_spin: "GIRAR", btn_spinning: "A GIRAR...",
    lbl_red: "VERMELHO", lbl_black: "PRETO", lbl_zero: "ZERO",

    instr_dice: "Prevê o resultado. Ajusta a barra para mudar o risco.",
    lbl_multiplier: "MULTIPLICADOR", lbl_win_chance: "CHANCE", lbl_edge: "VANTAGEM CASA",
    btn_roll_under: "RODAR ABAIXO", btn_roll_over: "RODAR ACIMA", btn_roll: "RODAR", btn_rolling: "A RODAR...",

    lbl_mines: "Nº MINAS", instr_mines: "Encontra diamantes. Evita as minas e levanta quando quiseres!",
    modal_bomb_msg: "BOOM! Rebentaste uma mina.",

    lbl_select_side: "ESCOLHER LADO", lbl_heads: "CARA", lbl_tails: "COROA",
    btn_flip: "GIRAR", btn_flipping: "A GIRAR...",
    instr_coin: "Escolhe Cara ou Coroa. Duplica o teu dinheiro!",

    lbl_risk: "RISCO", lbl_rows: "LINHAS", lbl_low: "BAIXO", lbl_medium: "MÉDIO", lbl_high: "ALTO",
    btn_drop: "SOLTAR", instr_plinko: "Larga a bola e vê onde ela cai.",
    msg_invalid_amount: "Valor inválido",
  },

  // --- ESPANHOL ---
  es: {
    hero_pre: "EL FUTURO DEL", hero_line1: "CRYPTO", hero_line2: "GAMING",
    hero_subtitle: "Pagos instantáneos, juego justo y 1% de ventaja de la casa.",

    game_coinflip: "MONEDA", desc_coinflip: "Duplica tu USDC",
    game_dice: "DADOS", desc_dice: "Tira y Gana",
    game_roulette: "RULETA", desc_roulette: "Gira la Rueda",
    game_plinko: "PLINKO", desc_plinko: "Deja Caer y Gana",
    game_mines: "MINAS", desc_mines: "Estrategia Pura",

    modal_low_balance: "Saldo Insuficiente", win: "GANASTE", lose: "PERDISTE",
    btn_cashout: "RETIRAR", btn_play: "JUGAR", how_to_play: "CÓMO JUGAR",
    bankroll_label: "BANCA",

    lbl_sol_mode: "MODO USDC", lbl_usd_mode: "MODO USD", lbl_bet_amount: "APUESTA", lbl_profit: "GANANCIA",
    btn_deposit: "DEPOSITAR", btn_withdraw: "RETIRAR",
    
    // Fallback para Auth (usará EN se não traduzido, mas aqui deixo placeholder ou EN)
    msg_auth_sign: "Please sign the message to verify ownership.",
    msg_auth_success: "Login successful!",
    msg_auth_error: "Authentication failed. Try again.",
    msg_auth_loading: "Verifying wallet...",
    
    // --- MODAL & WALLET MESSAGES ---
    modal_deposit_title: "DEPOSITAR USDC",
    modal_withdraw_title: "RETIRAR USDC",
    modal_amount_sol: "CANTIDAD (USDC)",
    lbl_available: "Disponible",
    lbl_target_address: "DIRECCIÓN DE DESTINO",
    modal_devnet_warning: "Los depósitos están en preparación. Usa solo saldos de prueba.",
    msg_tx_confirm: "Transacción confirmada.",
    msg_dep_success: "Depósito exitoso!",
    msg_wit_success: "Procesando retiro...",
    msg_wit_low_balance: "Saldo insuficiente para retiro.",
    msg_error_connect: "Error de red o billetera. Revisa la consola.",

    instr_roulette: "Apuesta al Rojo, Negro o números. ¡Gira la rueda y gana!",
    lbl_chip_value: "VALOR FICHA", lbl_total_bet: "APUESTA TOTAL",
    btn_clear: "BORRAR", btn_spin: "GIRAR", btn_spinning: "GIRANDO...",
    lbl_red: "ROJO", lbl_black: "NEGRO", lbl_zero: "CERO",

    instr_dice: "Predice el resultado. Ajusta la barra para cambiar el riesgo.",
    lbl_multiplier: "MULTIPLICADOR", lbl_win_chance: "PROBABILIDAD", lbl_edge: "VENTAJA CASA",
    btn_roll_under: "RODAR BAJO", btn_roll_over: "RODAR ALTO", btn_roll: "TIRAR", btn_rolling: "TIRANDO...",

    lbl_mines: "CANT. MINAS", instr_mines: "¡Encuentra gemas y evita las minas! Retira cuando quieras.",
    modal_bomb_msg: "¡BOOM! Golpeaste una mina.",

    lbl_select_side: "ELEGIR LADO", lbl_heads: "CARA", lbl_tails: "CRUZ",
    btn_flip: "LANZAR", btn_flipping: "LANZANDO...",
    instr_coin: "Elige Cara o Cruz. ¡Duplica tu dinero!",

    lbl_risk: "RIESGO", lbl_rows: "FILAS", lbl_low: "BAJO", lbl_medium: "MEDIO", lbl_high: "ALTO",
    btn_drop: "SOLTAR", instr_plinko: "Deja caer la bola y gana premios.",
    msg_invalid_amount: "Cantidad inválida",
  },

  // --- FRANCÊS ---
  fr: {
    hero_pre: "LE FUTUR DU", hero_line1: "CRYPTO", hero_line2: "GAMING",
    hero_subtitle: "Paiements instantanés, jeu équitable et avantage de 1%.",

    game_coinflip: "PIÈCE", desc_coinflip: "Doublez votre USDC",
    game_dice: "DÉS", desc_dice: "Lancez et Gagnez",
    game_roulette: "ROULETTE", desc_roulette: "Faites Tourner",
    game_plinko: "PLINKO", desc_plinko: "Lâchez et Multipliez",
    game_mines: "MINES", desc_mines: "Stratégie Pure",

    modal_low_balance: "Solde Insuffisant", win: "GAGNÉ", lose: "PERDU",
    btn_cashout: "ENCAISSER", btn_play: "JOUER", how_to_play: "COMMENT JOUER",
    bankroll_label: "SOLDE",

    lbl_sol_mode: "MODE USDC", lbl_usd_mode: "MODE USD", lbl_bet_amount: "MISE", lbl_profit: "PROFIT",
    btn_deposit: "DÉPOSER", btn_withdraw: "RETIRER",

    // --- MODAL & WALLET MESSAGES ---
    modal_deposit_title: "DÉPOSER USDC",
    modal_withdraw_title: "RETIRER USDC",
    modal_amount_sol: "MONTANT (USDC)",
    lbl_available: "Disponible",
    lbl_target_address: "ADRESSE CIBLE",
    modal_devnet_warning: "Les dépôts sont en préparation. Utilisez uniquement des soldes de test.",
    msg_tx_confirm: "Transaction confirmée.",
    msg_dep_success: "Dépôt réussi!",
    msg_wit_success: "Retrait en cours...",
    msg_wit_low_balance: "Solde en jeu insuffisant pour le retrait.",
    msg_error_connect: "Erreur réseau/portefeuille. Vérifiez la console.",

    instr_roulette: "Misez sur Rouge, Noir ou des numéros. Faites tourner et gagnez !",
    lbl_chip_value: "VALEUR JETON", lbl_total_bet: "MISE TOTALE",
    btn_clear: "EFFACER", btn_spin: "TOURNER", btn_spinning: "EN COURS...",
    lbl_red: "ROUGE", lbl_black: "NOIR", lbl_zero: "ZÉRO",

    instr_dice: "Prédisez le résultat. Ajustez le curseur pour changer le risque.",
    lbl_multiplier: "MULTIPLICATEUR", lbl_win_chance: "CHANCE", lbl_edge: "AVANTAGE MAISON",
    btn_roll_under: "ROULER SOUS", btn_roll_over: "ROULER SUR", btn_roll: "LANCER", btn_rolling: "EN COURS...",

    lbl_mines: "NB MINES", instr_mines: "Trouvez des gemmes, évitez les mines !",
    modal_bomb_msg: "BOUM ! Vous avez touché une mine.",

    lbl_select_side: "CHOISIR CÔTÉ", lbl_heads: "FACE", lbl_tails: "PILE",
    btn_flip: "LANCER", btn_flipping: "EN COURS...",
    instr_coin: "Pile ou Face ? Doublez votre mise !",

    lbl_risk: "RISQUE", lbl_rows: "RANGÉES", lbl_low: "FAIBLE", lbl_medium: "MOYEN", lbl_high: "ÉLEVÉ",
    btn_drop: "LÂCHER", instr_plinko: "Lâchez la bille pour gagner gros.",
    msg_invalid_amount: "Montant invalide",
  },

  // --- ALEMÃO ---
  de: {
    hero_pre: "DIE ZUKUNFT DES", hero_line1: "CRYPTO", hero_line2: "GAMING",
    hero_subtitle: "Sofortige Auszahlungen, faires Spiel und 1% Hausvorteil.",

    game_coinflip: "MÜNZE", desc_coinflip: "Verdoppeln Sie Ihr USDC",
    game_dice: "WÜRFEL", desc_dice: "Rollen & Gewinnen",
    game_roulette: "ROULETTE", desc_roulette: "Drehen Sie das Rad",
    game_plinko: "PLINKO", desc_plinko: "Fallenlassen & Multiplizieren",
    game_mines: "MINEN", desc_mines: "Strategie pur",

    modal_low_balance: "Zu wenig Guthaben", win: "GEWONNEN", lose: "VERLOREN",
    btn_cashout: "AUSZAHLEN", btn_play: "SPIELEN", how_to_play: "SPIELANLEITUNG",
    bankroll_label: "GUTHABEN",

    lbl_sol_mode: "USDC MODUS", lbl_usd_mode: "USD MODUS", lbl_bet_amount: "EINSATZ", lbl_profit: "GEWINN",
    btn_deposit: "EINZAHLEN", btn_withdraw: "ABHEBEN",

    // --- MODAL & WALLET MESSAGES ---
    modal_deposit_title: "USDC EINZAHLEN",
    modal_withdraw_title: "USDC ABHEBEN",
    modal_amount_sol: "BETRAG (USDC)",
    lbl_available: "Verfügbar",
    lbl_target_address: "ZIELADRESSE",
    modal_devnet_warning: "Einzahlungen werden vorbereitet. Nutzen Sie nur Testguthaben.",
    msg_tx_confirm: "Transaktion bestätigt.",
    msg_dep_success: "Einzahlung erfolgreich!",
    msg_wit_success: "Auszahlung wird verarbeitet...",
    msg_wit_low_balance: "Zu wenig In-Game-Guthaben für die Auszahlung.",
    msg_error_connect: "Netzwerk- oder Wallet-Fehler. Konsole prüfen.",

    instr_roulette: "Setzen Sie auf Rot, Schwarz oder Zahlen. Drehen und gewinnen!",
    lbl_chip_value: "CHIPWERT", lbl_total_bet: "GESAMTEINSATZ",
    btn_clear: "LÖSCHEN", btn_spin: "DREHEN", btn_spinning: "DREHT...",
    lbl_red: "ROT", lbl_black: "SCHWARZ", lbl_zero: "NULL",

    instr_dice: "Sagen Sie das Ergebnis voraus. Passen Sie das Risiko an.",
    lbl_multiplier: "MULTIPLICATOR", lbl_win_chance: "CHANCE", lbl_edge: "HAUSVORTEIL",
    btn_roll_under: "UNTER ROLLEN", btn_roll_over: "ÜBER ROLLEN", btn_roll: "WÜRFELN", btn_rolling: "ROLLT...",

    lbl_mines: "ANZAHL MINEN", instr_mines: "Finden Sie Edelsteine, vermeiden Sie Minen!",
    modal_bomb_msg: "BOOM! Mine getroffen.",

    lbl_select_side: "SEITE WÄHLEN", lbl_heads: "KOPF", lbl_tails: "ZAHL",
    btn_flip: "WERFEN", btn_flipping: "WIRFT...",
    instr_coin: "Kopf oder Zahl? Verdoppeln Sie Ihr Geld!",

    lbl_risk: "RISIKO", lbl_rows: "REIHEN", lbl_low: "NIEDRIG", lbl_medium: "MITTEL", lbl_high: "HOCH",
    btn_drop: "FALLEN LASSEN", instr_plinko: "Lassen Sie die Kugel fallen.",
    msg_invalid_amount: "Ungültiger Betrag",
  },

  // --- RUSSO ---
  ru: {
    hero_pre: "БУДУЩЕЕ", hero_line1: "КРИПТО", hero_line2: "ГЕЙМИНГА",
    hero_subtitle: "Мгновенные выплаты, честная игра и преимущество казино 1%.",

    game_coinflip: "МОНЕТКА", desc_coinflip: "Удвойте свои USDC",
    game_dice: "КОСТИ", desc_dice: "Бросай и Выигрывай",
    game_roulette: "РУЛЕТКА", desc_roulette: "Крути Колесо",
    game_plinko: "ПЛИНКО", desc_plinko: "Бросай и Умножай",
    game_mines: "МИНЫ", desc_mines: "Стратегия",

    modal_low_balance: "Недостаточно средств", win: "ПОБЕДА", lose: "ПРОИГРЫШ",
    btn_cashout: "ЗАБРАТЬ", btn_play: "ИГРАТЬ", how_to_play: "КАК ИГРАТЬ",
    bankroll_label: "БАЛАНС",

    lbl_sol_mode: "РЕЖИМ USDC", lbl_usd_mode: "РЕЖИМ USD", lbl_bet_amount: "СТАВКА", lbl_profit: "ПРИБЫЛЬ",
    btn_deposit: "ДЕПОЗИТ", btn_withdraw: "ВЫВОД",

    // --- MODAL & WALLET MESSAGES ---
    modal_deposit_title: "ДЕПОЗИТ USDC",
    modal_withdraw_title: "ВЫВОД USDC",
    modal_amount_sol: "СУММА (USDC)",
    lbl_available: "Доступно",
    lbl_target_address: "АДРЕС ПОЛУЧАТЕЛЯ",
    modal_devnet_warning: "Депозиты готовятся. Используйте только тестовые балансы.",
    msg_tx_confirm: "Транзакция подтверждена.",
    msg_dep_success: "Депозит успешен!",
    msg_wit_success: "Вывод средств в обработке...",
    msg_wit_low_balance: "Недостаточно средств в игре для вывода.",
    msg_error_connect: "Ошибка сети или кошелька. Проверьте консоль.",

    instr_roulette: "Ставьте на Красное, Черное или числа. Крутите и выигрывайте!",
    lbl_chip_value: "ФИШКА", lbl_total_bet: "ОБЩАЯ СТАВКА",
    btn_clear: "ОЧИСТИТЬ", btn_spin: "КРУТИТЬ", btn_spinning: "КРУТИТСЯ...",
    lbl_red: "КРАСНЫЙ", lbl_black: "ЧЕРНЫЙ", lbl_zero: "НОЛЬ",

    instr_dice: "Угадайте результат. Настройте шанс победы.",
    lbl_multiplier: "МНОЖИТЕЛЬ", lbl_win_chance: "ШАНС", lbl_edge: "ПРЕИМУЩЕСТВО",
    btn_roll_under: "МЕНЬШЕ", btn_roll_over: "БОЛЬШЕ", btn_roll: "БРОСОК", btn_rolling: "БРОСОК...",

    lbl_mines: "КОЛ-ВО МИН", instr_mines: "Ищите камни, избегайте мин!",
    modal_bomb_msg: "БУМ! Вы подорвались.",

    lbl_select_side: "ВЫБОР СТОРОНЫ", lbl_heads: "ОРЕЛ", lbl_tails: "РЕШКА",
    btn_flip: "БРОСИТЬ", btn_flipping: "ВРАЩЕНИЕ...",
    instr_coin: "Орел или Решка? Удвойте ставку!",

    lbl_risk: "РИСК", lbl_rows: "РЯДЫ", lbl_low: "НИЗКИЙ", lbl_medium: "СРЕДНИЙ", lbl_high: "ВЫСОКИЙ",
    btn_drop: "БРОСИТЬ", instr_plinko: "Бросайте шар и выигрывайте.",
    msg_invalid_amount: "Неверная сумма",
  },

  // --- CHINÊS ---
  zh: {
    hero_pre: "未来的", hero_line1: "加密", hero_line2: "博彩",
    hero_subtitle: "即时支付，公平游戏，1% 赌场优势。",

    game_coinflip: "抛硬币", desc_coinflip: "USDC翻倍",
    game_dice: "骰子", desc_dice: "掷骰赢大奖",
    game_roulette: "轮盘", desc_roulette: "旋转赢奖",
    game_plinko: "柏青哥", desc_plinko: "落下并倍增",
    game_mines: "扫雷", desc_mines: "策略扫雷",

    modal_low_balance: "余额不足", win: "你赢了", lose: "你输了",
    btn_cashout: "提现", btn_play: "开始", how_to_play: "怎么玩",
    bankroll_label: "资金",

    lbl_sol_mode: "USDC模式", lbl_usd_mode: "USD模式", lbl_bet_amount: "下注额", lbl_profit: "利润",
    btn_deposit: "充值", btn_withdraw: "提取",

    // --- MODAL & WALLET MESSAGES ---
    modal_deposit_title: "充值 USDC",
    modal_withdraw_title: "提取 USDC",
    modal_amount_sol: "金额 (USDC)",
    lbl_available: "可用",
    lbl_target_address: "目标地址",
    modal_devnet_warning: "充值功能正在准备中。仅使用测试余额。",
    msg_tx_confirm: "交易已确认。",
    msg_dep_success: "充值成功！",
    msg_wit_success: "正在处理提款...",
    msg_wit_low_balance: "游戏内余额不足，无法提款。",
    msg_error_connect: "网络或钱包错误。检查控制台。",

    instr_roulette: "押注红色、黑色或数字。旋转轮盘赢取奖金！",
    lbl_chip_value: "筹码", lbl_total_bet: "总赌注",
    btn_clear: "清除", btn_spin: "旋转", btn_spinning: "旋转中...",
    lbl_red: "红", lbl_black: "黑", lbl_zero: "零",

    instr_dice: "预测结果。调整滑块改变风险。",
    lbl_multiplier: "倍数", lbl_win_chance: "胜率", lbl_edge: "赌场优势",
    btn_roll_under: "掷低", btn_roll_over: "掷高", btn_roll: "掷骰", btn_rolling: "掷骰中...",

    lbl_mines: "地雷数", instr_mines: "寻找宝石，避开地雷！",
    modal_bomb_msg: "轰！你踩雷了。",

    lbl_select_side: "选边", lbl_heads: "正面", lbl_tails: "反面",
    btn_flip: "投掷", btn_flipping: "翻转中...",
    instr_coin: "正面或反面？翻倍你的钱！",

    lbl_risk: "风险", lbl_rows: "行数", lbl_low: "低", lbl_medium: "中", lbl_high: "高",
    btn_drop: "丢球", instr_plinko: "丢下弹珠赢取倍数。",
    msg_invalid_amount: "金额无效",
  },

  // --- HINDI ---
  hi: {
    hero_pre: "भविष्य का", hero_line1: "क्रिप्टो", hero_line2: "गेमिंग",
    hero_subtitle: "तत्काल भुगतान, निष्पक्ष खेल और 1% हाउस एज।",

    game_coinflip: "सिक्का उछालना", desc_coinflip: "अपना USDC दोगुना करें",
    game_dice: "पासा", desc_dice: "रोल करें और जीतें",
    game_roulette: "रूले", desc_roulette: "पहिया घुमाएं",
    game_plinko: "प्लिंको", desc_plinko: "गिराएं और गुणा करें",
    game_mines: "माइन्स", desc_mines: "रणनीतिक खेल",

    modal_low_balance: "अपर्याप्त शेष", win: "जीत", lose: "हार",
    btn_cashout: "कैशआउट", btn_play: "खेलें", how_to_play: "कैसे खेलें",
    bankroll_label: "बैंकरोल",

    lbl_sol_mode: "USDC मोड", lbl_usd_mode: "USD मोड", lbl_bet_amount: "शर्त राशि", lbl_profit: "लाभ",
    btn_deposit: "जमा करें", btn_withdraw: "निकालें",

    // --- MODAL & WALLET MESSAGES ---
    modal_deposit_title: "USDC जमा करें",
    modal_withdraw_title: "USDC निकालें",
    modal_amount_sol: "राशि (USDC)",
    lbl_available: "उपलब्ध",
    lbl_target_address: "लक्ष्य पता",
    modal_devnet_warning: "जमा सुविधा तैयार की जा रही है। केवल टेस्ट बैलेंस का उपयोग करें।",
    msg_tx_confirm: "लेनदेन की पुष्टि हुई।",
    msg_dep_success: "जमा सफल!",
    msg_wit_success: "निकासी प्रक्रिया में है...",
    msg_wit_low_balance: "निकासी के लिए अपर्याप्त इन-गेम बैलेंस।",
    msg_error_connect: "नेटवर्क या वॉलेट त्रुटि। कंसोल की जाँच करें।",

    instr_roulette: "लाल, काले या संख्याओं पर दांव लगाएं। पहिया घुमाएं और जीतें!",
    lbl_chip_value: "चिप मान", lbl_total_bet: "कुल दांव",
    btn_clear: "साफ़ करें", btn_spin: "घुमाएं", btn_spinning: "घूम रहा है...",
    lbl_red: "लाल", lbl_black: "काला", lbl_zero: "शून्य",

    instr_dice: "परिणाम की भविष्यवाणी करें। जोखिम समायोजित करें।",
    lbl_multiplier: "गुणांक", lbl_win_chance: "जीतने का मौका", lbl_edge: "हाउस एज",
    btn_roll_under: "नीचे रोल करें", btn_roll_over: "ऊपर रोल करें", btn_roll: "रोल करें", btn_rolling: "रोलिंग...",

    lbl_mines: "माइन्स", instr_mines: "रत्न खोजें और माइन्स से बचें!",
    modal_bomb_msg: "बूम! आपने माइन हिट की।",

    lbl_select_side: "पक्ष चुनें", lbl_heads: "चित", lbl_tails: "पट",
    btn_flip: "उछालें", btn_flipping: "घूम रहा है...",
    instr_coin: "चित या पट? अपना पैसा दोगुना करें!",

    lbl_risk: "जोखिम", lbl_rows: "पंक्तियाँ", lbl_low: "कम", lbl_medium: "मध्यम", lbl_high: "उच्च",
    btn_drop: "गिराएं", instr_plinko: "गेंद गिराएं और जीतें।",
    msg_invalid_amount: "अमान्य राशि",
  }
};

const catalogTranslations: Record<Language, Record<string, string>> = {
  en: { catalog_title: 'CASINO CATALOG', catalog_subtitle: 'External games · provider-owned outcomes · unified ledger', catalog_all: 'ALL', catalog_slots: 'SLOTS', catalog_live: 'LIVE CASINO', catalog_open: 'OPEN GAME', catalog_unavailable: 'Catalog unavailable', catalog_disabled_title: 'External casino catalog unavailable', catalog_disabled_message: 'The external casino provider is currently disabled. Originals remain available from the Casino tab.', catalog_session: 'Sandbox provider session active.', catalog_test_wager: 'Test wager: 0.001 USDC.', catalog_place: 'PLACE TEST WAGER', catalog_close: 'CLOSE', catalog_result: 'Provider result', catalog_empty: 'No games available in this category.' },
  pt: { catalog_title: 'CATÁLOGO DO CASINO', catalog_subtitle: 'Jogos externos · resultados do provider · ledger unificado', catalog_all: 'TODOS', catalog_slots: 'SLOTS', catalog_live: 'CASINO AO VIVO', catalog_open: 'ABRIR JOGO', catalog_unavailable: 'Catálogo indisponível', catalog_disabled_title: 'Catálogo externo indisponível', catalog_disabled_message: 'O provider de casino externo está desativado. Os Originals continuam disponíveis no separador Casino.', catalog_session: 'Sessão de teste do provider ativa.', catalog_test_wager: 'Aposta de teste: 0,001 USDC.', catalog_place: 'FAZER APOSTA DE TESTE', catalog_close: 'FECHAR', catalog_result: 'Resultado do provider', catalog_empty: 'Não existem jogos disponíveis nesta categoria.' },
  es: { catalog_title: 'CATÁLOGO DEL CASINO', catalog_subtitle: 'Juegos externos · resultados del proveedor · ledger unificado', catalog_all: 'TODOS', catalog_slots: 'SLOTS', catalog_live: 'CASINO EN VIVO', catalog_open: 'ABRIR JUEGO', catalog_unavailable: 'Catálogo no disponible', catalog_disabled_title: 'Catálogo de casino externo no disponible', catalog_disabled_message: 'El proveedor de casino externo está desactivado. Los Originals siguen disponibles en la pestaña Casino.', catalog_session: 'Sesión de prueba del proveedor activa.', catalog_test_wager: 'Apuesta de prueba: 0,001 USDC.', catalog_place: 'HACER APUESTA DE PRUEBA', catalog_close: 'CERRAR', catalog_result: 'Resultado del proveedor', catalog_empty: 'No hay juegos disponibles en esta categoría.' },
  fr: { catalog_title: 'CATALOGUE DU CASINO', catalog_subtitle: 'Jeux externes · résultats du fournisseur · ledger unifié', catalog_all: 'TOUS', catalog_slots: 'SLOTS', catalog_live: 'CASINO EN DIRECT', catalog_open: 'OUVRIR LE JEU', catalog_unavailable: 'Catalogue indisponible', catalog_disabled_title: 'Catalogue de casino externe indisponible', catalog_disabled_message: 'Le fournisseur de casino externe est désactivé. Les Originals restent disponibles dans l’onglet Casino.', catalog_session: 'Session de test du fournisseur active.', catalog_test_wager: 'Mise de test : 0,001 USDC.', catalog_place: 'PLACER LA MISE DE TEST', catalog_close: 'FERMER', catalog_result: 'Résultat du fournisseur', catalog_empty: 'Aucun jeu disponible dans cette catégorie.' },
  de: { catalog_title: 'CASINO-KATALOG', catalog_subtitle: 'Externe Spiele · Anbietergebnisse · einheitliches Ledger', catalog_all: 'ALLE', catalog_slots: 'SLOTS', catalog_live: 'LIVE-CASINO', catalog_open: 'SPIEL ÖFFNEN', catalog_unavailable: 'Katalog nicht verfügbar', catalog_disabled_title: 'Externer Casino-Katalog nicht verfügbar', catalog_disabled_message: 'Der externe Casino-Anbieter ist deaktiviert. Originals bleiben im Casino-Tab verfügbar.', catalog_session: 'Testsitzung des Anbieters aktiv.', catalog_test_wager: 'Testwette: 0,001 USDC.', catalog_place: 'TESTWETTE PLATZIEREN', catalog_close: 'SCHLIESSEN', catalog_result: 'Ergebnis des Anbieters', catalog_empty: 'Keine Spiele in dieser Kategorie verfügbar.' },
  ru: { catalog_title: 'КАТАЛОГ КАЗИНО', catalog_subtitle: 'Внешние игры · результаты провайдера · единый ledger', catalog_all: 'ВСЕ', catalog_slots: 'СЛОТЫ', catalog_live: 'КАЗИНО LIVE', catalog_open: 'ОТКРЫТЬ ИГРУ', catalog_unavailable: 'Каталог недоступен', catalog_disabled_title: 'Внешний каталог казино недоступен', catalog_disabled_message: 'Внешний провайдер казино отключён. Originals доступны на вкладке Casino.', catalog_session: 'Тестовая сессия провайдера активна.', catalog_test_wager: 'Тестовая ставка: 0,001 USDC.', catalog_place: 'СДЕЛАТЬ ТЕСТОВУЮ СТАВКУ', catalog_close: 'ЗАКРЫТЬ', catalog_result: 'Результат провайдера', catalog_empty: 'В этой категории нет доступных игр.' },
  zh: { catalog_title: '赌场目录', catalog_subtitle: '外部游戏 · 供应商结果 · 统一账本', catalog_all: '全部', catalog_slots: '老虎机', catalog_live: '真人赌场', catalog_open: '打开游戏', catalog_unavailable: '目录暂不可用', catalog_disabled_title: '外部赌场目录暂不可用', catalog_disabled_message: '外部赌场供应商目前已停用。Originals 仍可在 Casino 标签中使用。', catalog_session: '供应商测试会话已激活。', catalog_test_wager: '测试投注：0.001 USDC。', catalog_place: '进行测试投注', catalog_close: '关闭', catalog_result: '供应商结果', catalog_empty: '此类别暂无可用游戏。' },
  hi: { catalog_title: 'कैसीनो कैटलॉग', catalog_subtitle: 'बाहरी गेम · प्रदाता परिणाम · एकीकृत लेजर', catalog_all: 'सभी', catalog_slots: 'स्लॉट्स', catalog_live: 'लाइव कैसीनो', catalog_open: 'गेम खोलें', catalog_unavailable: 'कैटलॉग उपलब्ध नहीं है', catalog_disabled_title: 'बाहरी कैसीनो कैटलॉग उपलब्ध नहीं है', catalog_disabled_message: 'बाहरी कैसीनो प्रदाता बंद है। Originals Casino टैब में उपलब्ध हैं।', catalog_session: 'प्रदाता का टेस्ट सत्र सक्रिय है।', catalog_test_wager: 'टेस्ट बेट: 0.001 USDC।', catalog_place: 'टेस्ट बेट लगाएं', catalog_close: 'बंद करें', catalog_result: 'प्रदाता परिणाम', catalog_empty: 'इस श्रेणी में कोई गेम उपलब्ध नहीं है।' },
};

// Static translations for homepage copy introduced after the original locale tables.
// Keeping these local makes language changes instant and deterministic in production.
const homeTranslations: Record<Language, Record<string, string>> = {
  en: {}, pt: {},
  es: { hero_description: 'Juega Originals, sigue mercados deportivos y mantén un saldo USDC sencillo.', home_open_sports: 'ABRIR SPORTSBOOK', home_open_casino: 'EXPLORAR CASINO', home_originals: 'Juegos originales', home_currency: 'Unidad contable', home_play_anytime: 'Juega cuando quieras', home_account: 'TU CUENTA', home_ready: 'Listo cuando tú quieras', home_account_link: 'Cuenta', home_authenticated: 'Tu cuenta está lista para jugar.', home_sign_to_continue: 'Firma el mensaje en tu wallet para continuar.', home_connect_to_start: 'Conéctate una vez, deposita y juega.', home_step_connect: 'Conectar', home_step_deposit: 'Depositar', home_step_play: 'Jugar', home_games_kicker: 'ORIGINALS DEL CASINO', home_games_title: 'Elige tu juego', home_view_all: 'Ver todos', home_sports_title: 'Los mercados se mueven. Prepárate.', home_sports_description: 'Explora mercados deportivos, apuestas simples y combinadas.', home_browse_markets: 'Ver mercados', home_fairness_kicker: 'JUEGO VERIFICABLE', home_fairness_title: 'Justo por diseño', home_fairness_description: 'Cada juego incluye una prueba de fairness verificable.', home_account_kicker: 'ÁREA DEL JUGADOR', home_account_title: 'Tu historial y preferencias', home_account_description: 'Gestiona tu perfil, favoritos e historial en una cuenta segura.', home_open_account: 'Abrir cuenta', game_crash: 'CRASH', desc_crash: 'Monta el multiplicador', game_limbo: 'LIMBO', desc_limbo: 'Define tu objetivo', game_blackjack: 'BLACKJACK', desc_blackjack: 'Vence al crupier', home_fair_badge: 'Juego justo', home_sports_label: 'Sportsbook', home_account_label: 'ÁREA DEL JUGADOR' },
  fr: { hero_description: 'Jouez aux Originals, suivez les marchés sportifs et gardez un solde USDC simple.', home_open_sports: 'OUVRIR LE SPORTSBOOK', home_open_casino: 'EXPLORER LE CASINO', home_originals: 'Jeux originaux', home_currency: 'Unité comptable', home_play_anytime: 'Jouez à tout moment', home_account: 'VOTRE COMPTE', home_ready: 'Prêt quand vous l’êtes', home_account_link: 'Compte', home_authenticated: 'Votre compte est prêt à jouer.', home_sign_to_continue: 'Signez le message dans votre wallet pour continuer.', home_connect_to_start: 'Connectez-vous, déposez et jouez.', home_step_connect: 'Connexion', home_step_deposit: 'Dépôt', home_step_play: 'Jouer', home_games_kicker: 'ORIGINALS DU CASINO', home_games_title: 'Choisissez votre jeu', home_view_all: 'Voir tous les jeux', home_sports_title: 'Les marchés bougent. Soyez prêt.', home_sports_description: 'Explorez les marchés sportifs, paris simples et combinés.', home_browse_markets: 'Voir les marchés', home_fairness_kicker: 'JEU VÉRIFIABLE', home_fairness_title: 'Équitable par conception', home_fairness_description: 'Chaque jeu fournit une preuve de fairness vérifiable.', home_account_kicker: 'ESPACE JOUEUR', home_account_title: 'Votre historique et vos préférences', home_account_description: 'Gérez votre profil, vos favoris et votre historique.', home_open_account: 'Ouvrir le compte', game_crash: 'CRASH', desc_crash: 'Suivez le multiplicateur', game_limbo: 'LIMBO', desc_limbo: 'Définissez votre objectif', game_blackjack: 'BLACKJACK', desc_blackjack: 'Battez le croupier', home_fair_badge: 'Jeu équitable', home_sports_label: 'Sportsbook', home_account_label: 'ESPACE JOUEUR' },
  de: { hero_description: 'Spiele Originals, verfolge Sportmärkte und behalte ein einfaches USDC-Guthaben.', home_open_sports: 'SPORTSBOOK ÖFFNEN', home_open_casino: 'CASINO ENTDECKEN', home_originals: 'Originalspiele', home_currency: 'Kontoeinheit', home_play_anytime: 'Jederzeit spielen', home_account: 'DEIN KONTO', home_ready: 'Bereit, wenn du es bist', home_account_link: 'Konto', home_authenticated: 'Dein Konto ist spielbereit.', home_sign_to_continue: 'Signiere die Nachricht in deiner Wallet.', home_connect_to_start: 'Verbinden, einzahlen und spielen.', home_step_connect: 'Verbinden', home_step_deposit: 'Einzahlen', home_step_play: 'Spielen', home_games_kicker: 'CASINO ORIGINALS', home_games_title: 'Wähle dein Spiel', home_view_all: 'Alle Spiele', home_sports_title: 'Märkte bewegen sich. Sei bereit.', home_sports_description: 'Entdecke Sportmärkte, Einzelwetten und Kombis.', home_browse_markets: 'Märkte ansehen', home_fairness_kicker: 'NACHWEISLICH FAIR', home_fairness_title: 'Fair entwickelt', home_fairness_description: 'Jedes Spiel enthält einen überprüfbaren Fairness-Nachweis.', home_account_kicker: 'SPIELERBEREICH', home_account_title: 'Verlauf und Einstellungen', home_account_description: 'Verwalte Profil, Favoriten und Wetthistorie.', home_open_account: 'Konto öffnen', game_crash: 'CRASH', desc_crash: 'Folge dem Multiplikator', game_limbo: 'LIMBO', desc_limbo: 'Setze dein Ziel', game_blackjack: 'BLACKJACK', desc_blackjack: 'Schlage den Dealer', home_fair_badge: 'Nachweislich fair', home_sports_label: 'Sportsbook', home_account_label: 'SPIELERBEREICH' },
  ru: { hero_description: 'Играйте в Originals, следите за спортивными рынками и используйте простой баланс USDC.', home_open_sports: 'ОТКРЫТЬ SPORTSBOOK', home_open_casino: 'ОТКРЫТЬ КАЗИНО', home_originals: 'Оригинальные игры', home_currency: 'Единица расчёта', home_play_anytime: 'Играйте в любое время', home_account: 'ВАШ СЧЁТ', home_ready: 'Всё готово', home_account_link: 'Счёт', home_authenticated: 'Счёт готов к игре.', home_sign_to_continue: 'Подпишите сообщение в кошельке.', home_connect_to_start: 'Подключитесь, пополните баланс и играйте.', home_step_connect: 'Подключить', home_step_deposit: 'Пополнить', home_step_play: 'Играть', home_games_kicker: 'ОРИГИНАЛЬНЫЕ ИГРЫ', home_games_title: 'Выберите игру', home_view_all: 'Все игры', home_sports_title: 'Рынки меняются. Будьте готовы.', home_sports_description: 'Изучайте спортивные рынки, одиночные ставки и экспрессы.', home_browse_markets: 'Открыть рынки', home_fairness_kicker: 'ПРОВЕРЯЕМАЯ ИГРА', home_fairness_title: 'Честно по дизайну', home_fairness_description: 'Каждая игра содержит проверяемое доказательство честности.', home_account_kicker: 'КАБИНЕТ ИГРОКА', home_account_title: 'История и настройки', home_account_description: 'Управляйте профилем, избранным и историей ставок.', home_open_account: 'Открыть счёт', game_crash: 'CRASH', desc_crash: 'Следите за множителем', game_limbo: 'LIMBO', desc_limbo: 'Задайте цель', game_blackjack: 'BLACKJACK', desc_blackjack: 'Победите дилера', home_fair_badge: 'Проверяемая честность', home_sports_label: 'Sportsbook', home_account_label: 'КАБИНЕТ ИГРОКА' },
  zh: { hero_description: '畅玩原创游戏，关注体育市场，并使用简单的 USDC 余额。', home_open_sports: '打开体育博彩', home_open_casino: '探索赌场', home_originals: '原创游戏', home_currency: '记账单位', home_play_anytime: '随时畅玩', home_account: '你的账户', home_ready: '随时准备就绪', home_account_link: '账户', home_authenticated: '你的账户已准备好。', home_sign_to_continue: '请在钱包中签名以继续。', home_connect_to_start: '连接钱包、充值并开始游戏。', home_step_connect: '连接', home_step_deposit: '充值', home_step_play: '开始游戏', home_games_kicker: '赌场原创游戏', home_games_title: '选择游戏', home_view_all: '查看全部游戏', home_sports_title: '市场瞬息万变，做好准备。', home_sports_description: '探索体育市场、单注和串关。', home_browse_markets: '浏览市场', home_fairness_kicker: '可验证游戏', home_fairness_title: '公平设计', home_fairness_description: '每场游戏都包含可独立验证的公平性证明。', home_account_kicker: '玩家中心', home_account_title: '历史记录与偏好', home_account_description: '在安全账户中管理个人资料、收藏和投注记录。', home_open_account: '打开账户', game_crash: 'CRASH', desc_crash: '追逐倍数', game_limbo: 'LIMBO', desc_limbo: '设定目标', game_blackjack: 'BLACKJACK', desc_blackjack: '击败庄家', home_fair_badge: '公平可验证', home_sports_label: '体育博彩', home_account_label: '玩家中心' },
  hi: { hero_description: 'Originals खेलें, खेल बाज़ार देखें और एक सरल USDC बैलेंस रखें।', home_open_sports: 'स्पोर्ट्सबुक खोलें', home_open_casino: 'कैसीनो देखें', home_originals: 'ओरिजिनल गेम्स', home_currency: 'लेखा इकाई', home_play_anytime: 'कभी भी खेलें', home_account: 'आपका खाता', home_ready: 'आप तैयार हैं', home_account_link: 'खाता', home_authenticated: 'आपका खाता खेलने के लिए तैयार है।', home_sign_to_continue: 'जारी रखने के लिए वॉलेट संदेश साइन करें।', home_connect_to_start: 'कनेक्ट करें, जमा करें और खेलें।', home_step_connect: 'कनेक्ट', home_step_deposit: 'जमा', home_step_play: 'खेलें', home_games_kicker: 'कैसीनो ओरिजिनल्स', home_games_title: 'अपना गेम चुनें', home_view_all: 'सभी गेम देखें', home_sports_title: 'बाज़ार बदलते हैं। तैयार रहें।', home_sports_description: 'स्पोर्ट्स मार्केट, सिंगल और कंबिनेशन बेट देखें।', home_browse_markets: 'मार्केट देखें', home_fairness_kicker: 'सत्यापित खेल', home_fairness_title: 'डिज़ाइन से निष्पक्ष', home_fairness_description: 'हर गेम में स्वतंत्र रूप से सत्यापित fairness proof है।', home_account_kicker: 'प्लेयर हब', home_account_title: 'इतिहास और पसंद', home_account_description: 'प्रोफ़ाइल, पसंदीदा और बेट इतिहास प्रबंधित करें।', home_open_account: 'खाता खोलें', game_crash: 'CRASH', desc_crash: 'मल्टीप्लायर के साथ खेलें', game_limbo: 'LIMBO', desc_limbo: 'अपना लक्ष्य तय करें', game_blackjack: 'BLACKJACK', desc_blackjack: 'डीलर को हराएं', home_fair_badge: 'सत्यापित निष्पक्षता', home_sports_label: 'स्पोर्ट्सबुक', home_account_label: 'प्लेयर हब' }
};

export const useUIStore = create<UIState>((set, get) => ({
  language: 'en',
  setLanguage: (lang) => set({ language: lang }),
  t: (key) => {
    const lang = get().language;
    const locale = translations[lang] as Record<string, string>;
    const english = translations.en as Record<string, string>;
    return locale?.[key] || catalogTranslations[lang]?.[key] || homeTranslations[lang]?.[key] || english?.[key] || catalogTranslations.en?.[key] || homeTranslations.en?.[key] || key;
  }
}));
