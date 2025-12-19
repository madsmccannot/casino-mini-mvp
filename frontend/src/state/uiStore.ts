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
    hero_subtitle: "Instant payouts, fair gameplay, and 1% house edge. Join the revolution on Solana.",
    
    // --- GAME TITLES & DESC ---
    game_coinflip: "COINFLIP", desc_coinflip: "Double your SOL instantly",
    game_dice: "DICE", desc_dice: "Roll & Win Big",
    game_roulette: "ROULETTE", desc_roulette: "Spin the Wheel",
    game_plinko: "PLINKO", desc_plinko: "Drop & Multiply",
    game_mines: "MINES", desc_mines: "Strategic Sweeper",

    // --- GLOBAL UI & CONTROLS ---
    modal_low_balance: "Insufficient Balance", 
    win: "YOU WON", lose: "YOU LOST",
    btn_cashout: "CASHOUT", btn_play: "PLAY",
    how_to_play: "HOW TO PLAY",
    bankroll_label: "BANKROLL",
    
    lbl_sol_mode: "SOL MODE", lbl_usd_mode: "USD MODE",
    lbl_bet_amount: "BET AMOUNT", lbl_profit: "PROFIT",
    btn_deposit: "DEPOSIT", btn_withdraw: "WITHDRAW",
    
    // --- AUTH & WALLET (NOVOS) ---
    msg_auth_sign: "Please sign the message to verify ownership.",
    msg_auth_success: "Login successful!",
    msg_auth_error: "Authentication failed. Try again.",
    msg_auth_loading: "Verifying wallet...",

    // --- MODAL & WALLET MESSAGES ---
    modal_deposit_title: "DEPOSIT SOL",
    modal_withdraw_title: "WITHDRAW SOL",
    modal_amount_sol: "AMOUNT (SOL)",
    lbl_available: "Available",
    lbl_target_address: "TARGET ADDRESS",
    modal_devnet_warning: "WARNING: You are on Solana Devnet. Use test SOL only.",
    msg_tx_confirm: "Transaction confirmed on Solana network.",
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
    hero_subtitle: "Pagamentos instantâneos, jogo justo e 1% de vantagem da casa.",
    
    game_coinflip: "MOEDA", desc_coinflip: "Duplica o teu SOL",
    game_dice: "DADOS", desc_dice: "Roda e Ganha",
    game_roulette: "ROLETA", desc_roulette: "Gira a Roda",
    game_plinko: "PLINKO", desc_plinko: "Larga e Multiplica",
    game_mines: "MINAS", desc_mines: "Estratégia Pura",

    modal_low_balance: "Saldo Insuficiente", win: "GANHASTE", lose: "PERDESTE",
    btn_cashout: "LEVANTAR", btn_play: "JOGAR", how_to_play: "COMO JOGAR",
    bankroll_label: "BANCA",

    lbl_sol_mode: "MODO SOL", lbl_usd_mode: "MODO USD", lbl_bet_amount: "APOSTA", lbl_profit: "LUCRO",
    btn_deposit: "DEPOSITAR", btn_withdraw: "LEVANTAR",
    
    // --- AUTH NOVOS ---
    msg_auth_sign: "Assine a mensagem para verificar a carteira.",
    msg_auth_success: "Login com sucesso!",
    msg_auth_error: "Autenticação falhou. Tente novamente.",
    msg_auth_loading: "A verificar carteira...",
    
    // --- MODAL & WALLET MESSAGES ---
    modal_deposit_title: "DEPOSITAR SOL",
    modal_withdraw_title: "LEVANTAR SOL",
    modal_amount_sol: "QUANTIDADE (SOL)",
    lbl_available: "Disponível",
    lbl_target_address: "ENDEREÇO DE DESTINO",
    modal_devnet_warning: "AVISO: Está na Solana Devnet. Use SOL de teste apenas.",
    msg_tx_confirm: "Transação confirmada na rede Solana.",
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

    game_coinflip: "MONEDA", desc_coinflip: "Duplica tu SOL",
    game_dice: "DADOS", desc_dice: "Tira y Gana",
    game_roulette: "RULETA", desc_roulette: "Gira la Rueda",
    game_plinko: "PLINKO", desc_plinko: "Deja Caer y Gana",
    game_mines: "MINAS", desc_mines: "Estrategia Pura",

    modal_low_balance: "Saldo Insuficiente", win: "GANASTE", lose: "PERDISTE",
    btn_cashout: "RETIRAR", btn_play: "JUGAR", how_to_play: "CÓMO JUGAR",
    bankroll_label: "BANCA",

    lbl_sol_mode: "MODO SOL", lbl_usd_mode: "MODO USD", lbl_bet_amount: "APUESTA", lbl_profit: "GANANCIA",
    btn_deposit: "DEPOSITAR", btn_withdraw: "RETIRAR",
    
    // Fallback para Auth (usará EN se não traduzido, mas aqui deixo placeholder ou EN)
    msg_auth_sign: "Please sign the message to verify ownership.",
    msg_auth_success: "Login successful!",
    msg_auth_error: "Authentication failed. Try again.",
    msg_auth_loading: "Verifying wallet...",
    
    // --- MODAL & WALLET MESSAGES ---
    modal_deposit_title: "DEPOSITAR SOL",
    modal_withdraw_title: "RETIRAR SOL",
    modal_amount_sol: "CANTIDAD (SOL)",
    lbl_available: "Disponible",
    lbl_target_address: "DIRECCIÓN DE DESTINO",
    modal_devnet_warning: "ADVERTENCIA: Estás en Solana Devnet. Usa SOL de prueba.",
    msg_tx_confirm: "Transacción confirmada en la red Solana.",
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

    game_coinflip: "PIÈCE", desc_coinflip: "Doublez votre SOL",
    game_dice: "DÉS", desc_dice: "Lancez et Gagnez",
    game_roulette: "ROULETTE", desc_roulette: "Faites Tourner",
    game_plinko: "PLINKO", desc_plinko: "Lâchez et Multipliez",
    game_mines: "MINES", desc_mines: "Stratégie Pure",

    modal_low_balance: "Solde Insuffisant", win: "GAGNÉ", lose: "PERDU",
    btn_cashout: "ENCAISSER", btn_play: "JOUER", how_to_play: "COMMENT JOUER",
    bankroll_label: "SOLDE",

    lbl_sol_mode: "MODE SOL", lbl_usd_mode: "MODE USD", lbl_bet_amount: "MISE", lbl_profit: "PROFIT",
    btn_deposit: "DÉPOSER", btn_withdraw: "RETIRER",

    // --- MODAL & WALLET MESSAGES ---
    modal_deposit_title: "DÉPOSER SOL",
    modal_withdraw_title: "RETIRER SOL",
    modal_amount_sol: "MONTANT (SOL)",
    lbl_available: "Disponible",
    lbl_target_address: "ADRESSE CIBLE",
    modal_devnet_warning: "AVERTISSEMENT: Vous êtes sur Solana Devnet. Utilisez SOL de test.",
    msg_tx_confirm: "Transaction confirmée sur le réseau Solana.",
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

    game_coinflip: "MÜNZE", desc_coinflip: "Verdoppeln Sie Ihr SOL",
    game_dice: "WÜRFEL", desc_dice: "Rollen & Gewinnen",
    game_roulette: "ROULETTE", desc_roulette: "Drehen Sie das Rad",
    game_plinko: "PLINKO", desc_plinko: "Fallenlassen & Multiplizieren",
    game_mines: "MINEN", desc_mines: "Strategie pur",

    modal_low_balance: "Zu wenig Guthaben", win: "GEWONNEN", lose: "VERLOREN",
    btn_cashout: "AUSZAHLEN", btn_play: "SPIELEN", how_to_play: "SPIELANLEITUNG",
    bankroll_label: "GUTHABEN",

    lbl_sol_mode: "SOL MODUS", lbl_usd_mode: "USD MODUS", lbl_bet_amount: "EINSATZ", lbl_profit: "GEWINN",
    btn_deposit: "EINZAHLEN", btn_withdraw: "ABHEBEN",

    // --- MODAL & WALLET MESSAGES ---
    modal_deposit_title: "SOL EINZAHLEN",
    modal_withdraw_title: "SOL ABHEBEN",
    modal_amount_sol: "BETRAG (SOL)",
    lbl_available: "Verfügbar",
    lbl_target_address: "ZIELADRESSE",
    modal_devnet_warning: "WARNUNG: Sie sind auf Solana Devnet. Nutzen Sie Test-SOL.",
    msg_tx_confirm: "Transaktion im Solana-Netzwerk bestätigt.",
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

    game_coinflip: "МОНЕТКА", desc_coinflip: "Удвойте свои SOL",
    game_dice: "КОСТИ", desc_dice: "Бросай и Выигрывай",
    game_roulette: "РУЛЕТКА", desc_roulette: "Крути Колесо",
    game_plinko: "ПЛИНКО", desc_plinko: "Бросай и Умножай",
    game_mines: "МИНЫ", desc_mines: "Стратегия",

    modal_low_balance: "Недостаточно средств", win: "ПОБЕДА", lose: "ПРОИГРЫШ",
    btn_cashout: "ЗАБРАТЬ", btn_play: "ИГРАТЬ", how_to_play: "КАК ИГРАТЬ",
    bankroll_label: "БАЛАНС",

    lbl_sol_mode: "РЕЖИМ SOL", lbl_usd_mode: "РЕЖИМ USD", lbl_bet_amount: "СТАВКА", lbl_profit: "ПРИБЫЛЬ",
    btn_deposit: "ДЕПОЗИТ", btn_withdraw: "ВЫВОД",

    // --- MODAL & WALLET MESSAGES ---
    modal_deposit_title: "ДЕПОЗИТ SOL",
    modal_withdraw_title: "ВЫВОД SOL",
    modal_amount_sol: "СУММА (SOL)",
    lbl_available: "Доступно",
    lbl_target_address: "АДРЕС ПОЛУЧАТЕЛЯ",
    modal_devnet_warning: "ПРЕДУПРЕЖДЕНИЕ: Вы используете Solana Devnet. Только тестовый SOL.",
    msg_tx_confirm: "Транзакция подтверждена в сети Solana.",
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

    game_coinflip: "抛硬币", desc_coinflip: "SOL翻倍",
    game_dice: "骰子", desc_dice: "掷骰赢大奖",
    game_roulette: "轮盘", desc_roulette: "旋转赢奖",
    game_plinko: "柏青哥", desc_plinko: "落下并倍增",
    game_mines: "扫雷", desc_mines: "策略扫雷",

    modal_low_balance: "余额不足", win: "你赢了", lose: "你输了",
    btn_cashout: "提现", btn_play: "开始", how_to_play: "怎么玩",
    bankroll_label: "资金",

    lbl_sol_mode: "SOL模式", lbl_usd_mode: "USD模式", lbl_bet_amount: "下注额", lbl_profit: "利润",
    btn_deposit: "充值", btn_withdraw: "提取",

    // --- MODAL & WALLET MESSAGES ---
    modal_deposit_title: "充值 SOL",
    modal_withdraw_title: "提取 SOL",
    modal_amount_sol: "金额 (SOL)",
    lbl_available: "可用",
    lbl_target_address: "目标地址",
    modal_devnet_warning: "警告: 您在 Solana Devnet 上。仅使用测试 SOL。",
    msg_tx_confirm: "Solana 网络交易已确认。",
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

    game_coinflip: "सिक्का उछालना", desc_coinflip: "अपना SOL दोगुना करें",
    game_dice: "पासा", desc_dice: "रोल करें और जीतें",
    game_roulette: "रूले", desc_roulette: "पहिया घुमाएं",
    game_plinko: "प्लिंको", desc_plinko: "गिराएं और गुणा करें",
    game_mines: "माइन्स", desc_mines: "रणनीतिक खेल",

    modal_low_balance: "अपर्याप्त शेष", win: "जीत", lose: "हार",
    btn_cashout: "कैशआउट", btn_play: "खेलें", how_to_play: "कैसे खेलें",
    bankroll_label: "बैंकरोल",

    lbl_sol_mode: "SOL मोड", lbl_usd_mode: "USD मोड", lbl_bet_amount: "शर्त राशि", lbl_profit: "लाभ",
    btn_deposit: "जमा करें", btn_withdraw: "निकालें",

    // --- MODAL & WALLET MESSAGES ---
    modal_deposit_title: "SOL जमा करें",
    modal_withdraw_title: "SOL निकालें",
    modal_amount_sol: "राशि (SOL)",
    lbl_available: "उपलब्ध",
    lbl_target_address: "लक्ष्य पता",
    modal_devnet_warning: "चेतावनी: आप Solana Devnet पर हैं। केवल टेस्ट SOL का उपयोग करें।",
    msg_tx_confirm: "Solana नेटवर्क पर लेनदेन की पुष्टि हुई।",
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

export const useUIStore = create<UIState>((set, get) => ({
  language: 'en',
  setLanguage: (lang) => set({ language: lang }),
  t: (key) => {
    const lang = get().language;
    // Fallback para inglês se a chave não existir na língua escolhida
    // @ts-ignore
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  }
}));