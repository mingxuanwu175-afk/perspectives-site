// Everything the site says about Issue 01 (28 Sep to 23 Oct 2026).
// Edit this file to change events, teams or the tournament draw.
// Text that readers see is written as { en, zh, ja, ko }; see i18n.js.

const tx = (en, zh, ja, ko) => ({ en, zh, ja, ko });

export const ISSUE = {
  number: '01',
  start: '2026-09-28',
  end: '2026-10-23',
};

const EVERY_LUNCH = tx('Every lunchtime', '每天午休', '毎日昼休み', '매일 점심시간');
const ALL_SECONDARY = tx('All of Secondary.', '中学部全体。', '中等部の全生徒。', '중등부 전체.');
const FLASH_FORM = 'https://forms.cloud.microsoft/r/sv52mrSF9z';
const FLASH_PRACTICE = tx('Practice, 15 min at lunch', '练习，午休 15 分钟', '練習（昼休み15分）', '연습, 점심시간 15분');
const ORGANISERS = tx('Lu Ming Pui, Dylan and Ogi', 'Lu Ming Pui、Dylan 和 Ogi', 'Lu Ming Pui、Dylan、Ogi', 'Lu Ming Pui, Dylan, Ogi');

// Only things students can sign up for and take part in (Steve's rule for the
// activity list): no school-wide schedule items from the official calendar.
// kind: activity | break | feature | deadline
// facts: [label key from strings.js (fact.*), text]
export const EVENTS = [
  {
    id: 'next-wave-register',
    kind: 'deadline',
    title: tx('Last day to register for The Next Wave', 'The Next Wave 报名截止', 'The Next Wave 申し込み締め切り', 'The Next Wave 신청 마감'),
    short: tx('Next Wave sign-up closes', 'Next Wave 报名截止', 'Next Wave 申込締切', 'Next Wave 신청 마감'),
    start: '2026-09-30',
    end: '2026-09-30',
    opens: 'next-wave',
  },
  {
    // Details from the school's Spirit Week poster (Daily Bulletin, 24 Sep);
    // the full programme is its own page.
    id: 'spirit-week',
    kind: 'feature',
    look: 'spirit',
    title: tx('Spirit Week', '精神周', 'スピリット・ウィーク', '스피릿 위크'),
    start: '2026-09-28',
    end: '2026-10-01',
    when: tx('Lunch, 12:45 to 1:20', '午休 12:45–1:20', '昼休み 12:45〜13:20', '점심시간 12:45~1:20'),
    href: '#/spirit',
    metaKey: 'events.spiritMeta',
    ctaKey: 'events.spiritCta',
  },
  {
    // Think Pink Flashmob: the SY Arts Department email and Ms Manson's
    // ManageBac post (24 Sep). Three 15-minute lunchtime practices and a
    // lunchtime performance; `days` puts it on the calendar on those days only.
    id: 'think-pink-flashmob',
    kind: 'activity',
    title: tx('Think Pink Flashmob', 'Think Pink 快闪', 'Think Pink フラッシュモブ', 'Think Pink 플래시몹'),
    by: tx('SY Arts Department', 'SY Arts Department', 'SY Arts Department', 'SY Arts Department'),
    start: '2026-09-29',
    end: '2026-10-21',
    when: tx('Lunchtime', '午休', '昼休み', '점심시간'),
    days: [
      { date: '2026-09-29', when: FLASH_PRACTICE },
      { date: '2026-10-06', when: FLASH_PRACTICE },
      { date: '2026-10-20', when: FLASH_PRACTICE },
      { date: '2026-10-21', when: tx('Performance, lunch break', '演出，午休', '本番（昼休み）', '공연, 점심시간') },
    ],
    lead: tx(
      "October is Breast Cancer Awareness Month, and SY Arts is marking it 'the best way we know: by dancing!' Join the Think Pink Flashmob and help fill the school with pink. You don't need any dance experience, just your energy and your friends.",
      '十月是乳腺癌防治宣传月，SY Arts 要“用我们最拿手的方式来纪念它：跳舞！”加入 Think Pink 快闪，一起让整个学校染成粉色。不需要任何舞蹈经验，只要带上你的活力和朋友。',
      '10月は乳がん啓発月間。SY Arts は「私たちがいちばん得意な方法、ダンスで」この月を盛り上げます！Think Pink フラッシュモブに参加して、学校をピンクでいっぱいにしましょう。ダンス経験は要りません。元気と友だちがいれば大丈夫です。',
      '10월은 유방암 인식의 달입니다. SY Arts는 "우리가 가장 잘하는 방법, 춤으로" 이 달을 기념합니다! Think Pink 플래시몹에 참여해 학교를 핑크로 물들여 주세요. 춤 경험은 필요 없습니다. 에너지와 친구만 있으면 됩니다.',
    ),
    facts: [
      ['fact.who', tx(
        'Everyone is welcome, from Street Dance and K-Pop Dance to people who have never danced before.',
        '欢迎所有人：跳街舞、跳 K-Pop 的，还有从来没跳过舞的，都可以来。',
        '誰でも歓迎。ストリートダンスや K-POP ダンスをやっている人から、一度も踊ったことがない人まで。',
        '누구나 환영합니다. 스트리트 댄스나 K-POP 댄스를 하는 사람부터 춤을 한 번도 춰 본 적 없는 사람까지.',
      )],
      ['fact.when', tx(
        'Three lunchtime practices, only 15 minutes each: Tuesday 29 September, Tuesday 6 October and Tuesday 20 October. Performance: Wednesday 21 October, lunch break.',
        '午休练习 3 次，每次只要 15 分钟：9月29日（周二）、10月6日（周二）、10月20日（周二）。演出：10月21日（周三）午休。',
        '昼休みの練習は3回、各15分だけ：9月29日（火）、10月6日（火）、10月20日（火）。本番：10月21日（水）の昼休み。',
        '점심시간 연습 3번, 한 번에 15분: 9월 29일(화), 10월 6일(화), 10월 20일(화). 공연: 10월 21일(수) 점심시간.',
      )],
      ['fact.where', tx(
        "Practices in Ms Manson's room (Theatre 1, Block B).",
        '练习在 Ms Manson 的教室（B 栋 Theatre 1）。',
        '練習は Ms Manson の教室（B棟 Theatre 1）で。',
        '연습은 Ms Manson 교실(B동 Theatre 1)에서 합니다.',
      )],
      ['fact.counts', tx('Service as Action (SAA) on ManageBac.', 'ManageBac 上的 Service as Action（SAA）。', 'ManageBac の Service as Action（SAA）。', 'ManageBac의 Service as Action(SAA).')],
      ['fact.perks', tx(
        "Up to three house points. Free snacks at every practice. Be part of the school's Arts Community.",
        '最多 3 个学院分。每次练习都有免费零食。成为学校艺术社群的一员。',
        'ハウスポイント最大3点。練習のたびに無料のおやつ。学校のアーツ・コミュニティの一員になれます。',
        '하우스 점수 최대 3점. 연습 때마다 무료 간식. 학교 예술 커뮤니티의 일원이 됩니다.',
      )],
      ['fact.signup', tx(
        'Fill in the form with the button below, or scan the QR code on the posters around school.',
        '点下面的按钮填表，或者扫学校各处海报上的二维码。',
        '下のボタンからフォームに記入するか、校内のポスターの QR コードを読み取ってください。',
        '아래 버튼으로 신청서를 작성하거나, 학교 곳곳의 포스터에 있는 QR 코드를 스캔하세요.',
      )],
    ],
    link: { label: tx('Sign up on Microsoft Forms', '在 Microsoft Forms 报名', 'Microsoft Forms で申し込む', 'Microsoft Forms에서 신청하기'), href: FLASH_FORM },
  },
  {
    id: 'sports-day',
    kind: 'activity',
    title: tx('Sports Day', '运动会', '体育祭', '체육대회'),
    start: '2026-10-02',
    end: '2026-10-02',
    when: tx('All day', '全天', '終日', '종일'),
    lead: tx(
      'The houses compete across the day. Come dressed in your house colours.',
      '各学院全天比拼。穿上你所在学院的颜色来参加。',
      'ハウス対抗で一日中競います。自分のハウスカラーの服で来よう。',
      '하우스끼리 하루 종일 겨룹니다. 자기 하우스 색 옷을 입고 오세요.',
    ),
    facts: [
      ['fact.who', ALL_SECONDARY],
    ],
  },
  {
    id: 'next-wave',
    kind: 'activity',
    title: tx('The Next Wave', 'The Next Wave', 'The Next Wave', 'The Next Wave'),
    by: tx('OceanX Education and SOA Singapore', 'OceanX Education 与 SOA Singapore', 'OceanX Education・SOA Singapore', 'OceanX Education, SOA Singapore'),
    start: '2026-10-06',
    end: '2026-10-06',
    when: tx('7:00 to 8:30 pm', '晚上 7:00–8:30', '午後7時〜8時30分', '오후 7:00~8:30'),
    lead: tx(
      'An evening on careers in the ocean and sustainability, with OceanX Education Fellows, leaders from Sustainable Ocean Alliance Singapore and SMU Associate Professor Liu Nengye. There is a panel, real career stories and time to meet people. Light refreshments provided.',
      '一场关于海洋与可持续发展职业的晚间活动，嘉宾有 OceanX Education 研究员、Sustainable Ocean Alliance Singapore 的负责人，以及新加坡管理大学（SMU）副教授 Liu Nengye。有座谈、真实的职业故事，也有认识新朋友的时间。提供茶点。',
      '海洋とサステナビリティのキャリアを考える夜のイベントです。OceanX Education のフェロー、Sustainable Ocean Alliance Singapore のリーダー、シンガポール経営大学（SMU）の Liu Nengye 准教授が登壇します。パネルディスカッション、リアルなキャリアの話、交流の時間があります。軽食付き。',
      '해양과 지속가능성 분야 진로를 다루는 저녁 행사입니다. OceanX Education 펠로, Sustainable Ocean Alliance Singapore 리더, 싱가포르경영대(SMU) Liu Nengye 부교수가 함께합니다. 패널 토론, 실제 진로 이야기, 교류 시간이 있습니다. 간단한 다과가 제공됩니다.',
    ),
    facts: [
      ['fact.who', tx(
        'Anyone interested in the ocean, marine science, sustainability or environmental careers.',
        '对海洋、海洋科学、可持续发展或环境类职业感兴趣的人。',
        '海洋、海洋科学、サステナビリティ、環境分野の仕事に興味がある人。',
        '해양, 해양과학, 지속가능성, 환경 분야 진로에 관심 있는 사람.',
      )],
      ['fact.when', tx('Tuesday 6 October, 7:00 to 8:30 pm.', '10月6日（周二）晚上 7:00–8:30。', '10月6日（火）午後7時〜8時30分。', '10월 6일(화) 오후 7:00~8:30.')],
      ['fact.where', tx(
        'SMU Connexion, Level 2 Learning Studio, 40 Stamford Road.',
        'SMU Connexion 2 楼 Learning Studio，40 Stamford Road。',
        'SMU Connexion 2階 Learning Studio（40 Stamford Road）。',
        'SMU Connexion 2층 Learning Studio (40 Stamford Road).',
      )],
      ['fact.signup', tx('Register on Luma by Wednesday 30 September.', '9月30日（周三）前在 Luma 报名。', '9月30日（水）までに Luma で申し込み。', '9월 30일(수)까지 Luma에서 신청.')],
    ],
    link: { label: tx('Register on Luma', '在 Luma 报名', 'Luma で申し込む', 'Luma에서 신청하기'), href: 'https://luma.com/1oqp9xg3' },
  },
  {
    id: 'fall-break',
    kind: 'break',
    title: tx('Fall Break', '秋假', '秋休み', '가을 방학'),
    start: '2026-10-12',
    end: '2026-10-16',
  },
  {
    id: 'think-pink-basketball',
    kind: 'feature',
    title: tx('Think Pink Basketball', 'Think Pink 篮球赛', 'Think Pink バスケ大会', 'Think Pink 농구 대회'),
    by: ORGANISERS,
    // The games were Tuesday to Thursday (Steve, 23 Oct).
    start: '2026-10-20',
    end: '2026-10-22',
    when: EVERY_LUNCH,
    // Sign-ups have closed, so the line points to the results instead.
    metaKey: 'events.featureMetaDone',
    href: '#/basketball',
  },
  // The final moved from Friday 23 to Monday 26 October (organisers via Sam,
  // 26 Sep), then to Tuesday 27 October (Steve, 21 Oct). It is in the gym in
  // Block C (Steve, 27 Sep), full court.
  {
    id: 'think-pink-final',
    kind: 'feature',
    title: tx('Think Pink Basketball final', 'Think Pink 篮球赛 决赛', 'Think Pink バスケ大会 決勝', 'Think Pink 농구 대회 결승'),
    by: ORGANISERS,
    start: '2026-10-27',
    end: '2026-10-27',
    when: tx('In the gym (Block C), full court', 'C 栋体育馆，全场', 'C棟の体育館・フルコート', 'C동 체육관, 풀코트'),
    href: '#/basketball',
  },
];

// New rules from the organisers (25 Sep): the Sports Hall is no longer
// available, so games move to the Secondary outdoor court, half court,
// three on three, with two substitutes. Everything else is unchanged.
// Then (26 Sep, via Sam): Ms Cindy says Friday 23 October has another school
// activity, so the final moves to Monday 26 October, and it can use the gym,
// full court. Steve (21 Oct): the final is on Tuesday 27 October. Not said
// yet: the final's start time, and whether it is still 3 on 3. The site says
// neither. G6 joined on 7 Oct (Cindy, via Steve and Sam): G6 and G7 play as
// one team.
const FORMAT = tx('Half court, 3 on 3, 4 quarters of 5 minutes', '半场 3 打 3，4 节，每节 5 分钟', 'ハーフコート3対3、1クォーター5分×4', '하프코트 3대3, 5분 4쿼터');

export const TOURNAMENT = {
  title: tx('Think Pink Basketball', 'Think Pink 篮球赛', 'Think Pink バスケ大会', 'Think Pink 농구 대회'),
  where: tx('Secondary outdoor basketball court', '中学部室外篮球场', '中等部の屋外バスケットコート', '중등부 야외 농구장'),
  // The final is not on the outdoor court: the gym in Block C, full court.
  finalWhere: tx('the gym (Block C)', 'C 栋体育馆', 'C棟の体育館', 'C동 체육관'),
  finalFormat: tx('full court', '全场', 'フルコート', '풀코트'),
  organisers: ORGANISERS,
  contact: '29lu.mingpui@xwa.edu.sg',
  start: '2026-10-20',
  end: '2026-10-27',
  firstGame: '2026-10-20',
  // Sign-ups close after the last quarter-final: the final is between two of
  // the winners, so nobody new can join.
  signupUntil: '2026-10-22',
  // Countdown target, Singapore time. Lunch runs 12:45 to 1:20 (the Spirit
  // Week poster, Daily Bulletin, 24 Sep); the organisers have not given a
  // separate start time for the games.
  tipOff: '2026-10-20T12:45:00+08:00',
  format: FORMAT,
  lead: tx(
    'At lunch on each quarter-final day, two teams play; the winning team takes house points or a prize. At halftime there is a 5-minute shooting session, and anyone can come down and take a shot. Every ball thrown is a gesture of support and a blessing for breast cancer patients.',
    '四分之一决赛期间每天午休打一场；获胜的队伍赢得学院积分或奖品。中场有 5 分钟的投篮活动，谁都可以下场投一球。每一次投篮，都是对乳腺癌患者的支持和祝福。',
    '準々決勝の期間は毎日昼休みに1試合を行います。勝ったチームにはハウスポイントか賞品。ハーフタイムには5分間のシュートタイムがあり、誰でもコートに降りてシュートできます。一本一本のシュートが、乳がんの患者さんへの応援と祈りになります。',
    '8강 기간에는 매일 점심시간에 한 경기씩 열립니다. 이긴 팀은 하우스 점수나 상품을 받습니다. 하프타임에는 5분 동안 누구나 내려와 슛을 던질 수 있습니다. 공 하나하나가 유방암 환자를 향한 응원이자 축복입니다.',
  ),
  facts: [
    ['fact.who', tx(
      'Open to G6 to G10. Each G10 homeroom sends five players; G8 and G9 send five per year group; G6 and G7 play together as one team; FEP sends five too.',
      '开放给 G6 到 G10。每个 G10 班级出 5 人；G8、G9 每个年级出 5 人；G6 和 G7 合成一队；FEP 也出 5 人。',
      'G6〜G10 が対象。G10 は各クラスから5人、G8・G9 は学年全体から5人、G6 と G7 は合同で1チーム、FEP からも5人出ます。',
      'G6~G10 참가 가능. G10은 반마다 5명, G8·G9는 학년 전체에서 5명, G6과 G7은 함께 한 팀, FEP도 5명이 나옵니다.',
    )],
    ['fact.when', tx(
      'Quarter-finals: every lunchtime, Tuesday 20 to Thursday 22 October. Final: Tuesday 27 October.',
      '四分之一决赛：10月20日（周二）至22日（周四）每天午休。决赛：10月27日（周二）。',
      '準々決勝：10月20日（火）〜22日（木）の毎日昼休み。決勝：10月27日（火）。',
      '8강: 10월 20일(화)~22일(목) 매일 점심시간. 결승: 10월 27일(화).',
    )],
    ['fact.format', tx(
      'Quarter-finals: half court, 3 on 3. Final: full court. Every game: 4 quarters of 5 minutes.',
      '四分之一决赛：半场 3 打 3。决赛：全场。每场 4 节，每节 5 分钟。',
      '準々決勝：ハーフコート3対3。決勝：フルコート。全試合、1クォーター5分×4。',
      '8강: 하프코트 3대3. 결승: 풀코트. 모든 경기 5분 4쿼터.',
    )],
    ['fact.team', tx(
      'Five players per team. In the quarter-finals, three are on court and two are substitutes, and the substitutes must play after halftime. Each team decides on the day who starts, who comes on and in what order.',
      '每队 5 人。四分之一决赛 3 人上场、2 人替补，中场之后替补必须上场。谁先上场、谁当替补、上场顺序，由各队在现场自己决定。',
      '1チーム5人。準々決勝はコートに3人、交代要員が2人で、ハーフタイム後は交代要員が必ず出場します。誰が先に出るか、誰が交代要員か、出場の順番は各チームが当日その場で決めます。',
      '팀당 5명. 8강에서는 코트에 3명, 교체 선수 2명이며, 하프타임 이후에는 교체 선수가 반드시 뛰어야 합니다. 누가 먼저 뛰고 누가 교체 선수가 될지, 출전 순서는 각 팀이 당일 현장에서 정합니다.',
    )],
    ['fact.final', tx(
      'No semi-finals: the quarter-final winners are ranked by the points they scored, and the top two play the final on Tuesday 27 October.',
      '没有半决赛：四分之一决赛的胜队按得分排名，得分最高的两队 10月27日（周二）打决赛。',
      '準決勝はありません。準々決勝の勝者を得点順に並べ、上位2チームが10月27日（火）の決勝に進みます。',
      '4강전은 없습니다. 8강 승리 팀을 득점순으로 매겨 상위 두 팀이 10월 27일(화) 결승에 나갑니다.',
    )],
    ['fact.halftime', tx('5-minute shooting session. Anyone can join.', '5 分钟投篮活动，所有人都可以参加。', '5分間のシュートタイム。誰でも参加できます。', '5분 슛 이벤트. 누구나 참여할 수 있습니다.')],
    ['fact.where', tx(
      'Quarter-finals: Secondary outdoor basketball court. Final: the gym (Block C).',
      '四分之一决赛：中学部室外篮球场。决赛：C 栋体育馆。',
      '準々決勝：中等部の屋外バスケットコート。決勝：C棟の体育館。',
      '8강: 중등부 야외 농구장. 결승: C동 체육관.',
    )],
    ['fact.counts', tx('Service as Action (SAA).', 'Service as Action（SAA）。', 'Service as Action（SAA）。', 'Service as Action(SAA).')],
    ['fact.organisers', tx('Lu Ming Pui, Dylan and Ogi.', 'Lu Ming Pui、Dylan 和 Ogi。', 'Lu Ming Pui、Dylan、Ogi。', 'Lu Ming Pui, Dylan, Ogi.')],
  ],
};

// Joining the team (the cover's "Join the team" button and #/join, in
// views/joinform.js): what people can pick. The editors see the answers on
// #/admin.
const same = (s) => tx(s, s, s, s);
export const JOIN_ROLES = [
  { id: 'write', name: tx('Writing', '写稿', '執筆', '글쓰기') },
  { id: 'draw', name: tx('Drawing', '画画', 'イラスト', '그림') },
  { id: 'photo', name: tx('Photography', '摄影', '写真', '사진') },
  { id: 'interview', name: tx('Interviews', '采访', '取材', '인터뷰') },
  { id: 'edit', name: tx('Editing', '编辑校对', '編集・校正', '편집·교정') },
  { id: 'design', name: tx('Page layout', '排版设计', 'レイアウト', '레이아웃') },
  { id: 'translate', name: tx('Translation', '翻译', '翻訳', '번역') },
  { id: 'podcast', name: tx('Podcast and video', '播客与视频', 'ポッドキャスト・動画', '팟캐스트·영상') },
  { id: 'social', name: tx('Social media', '社交媒体', 'SNS', 'SNS') },
  { id: 'ops', name: tx('Logistics', '后勤（排班、发刊）', '運営・配布', '운영·배포') },
  { id: 'web', name: tx('Website', '网站', 'ウェブサイト', '웹사이트') },
];
// Languages people write in, each named in its own script.
export const JOIN_LANGS = [
  { id: 'zh', name: same('中文') },
  { id: 'en', name: same('English') },
  { id: 'ja', name: same('日本語') },
  { id: 'ko', name: same('한국어') },
  { id: 'other', name: tx('Other', '其他', 'その他', '기타') },
];

// The magazine prints one QR code, and it opens the cover. So the cover lists
// what readers can do right now; each item drops off after its `until` date.
// The join page's link to the form appears once JOIN_FORM is set.
export const JOIN_FORM = 'https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=0XHIlzG5xUqIMvlT87UwU1LjRTurPHlBjuSzU-x3U7RUM1JTV00zVTJRU1I5TlJFQVFMSFNPQjBVNi4u'; // the Microsoft Form for submissions (it takes files)
export const NOW_OPEN = [
  {
    href: '#/spirit',
    title: tx('Spirit Week', '精神周', 'スピリット・ウィーク', '스피릿 위크'),
    starts: '2026-09-28',
    startsKey: 'now.begins',
    until: '2026-10-01',
  },
  {
    // Opens the flashmob's details, which link to the SY Arts form.
    href: '#/events?open=think-pink-flashmob',
    title: tx('Think Pink Flashmob sign-up', 'Think Pink 快闪报名', 'Think Pink フラッシュモブの申し込み', 'Think Pink 플래시몹 신청'),
    starts: '2026-09-29',
    startsKey: 'now.practices',
    until: '2026-10-20',
  },
  {
    href: '#/basketball',
    title: tx('Think Pink Basketball sign-up', 'Think Pink 篮球赛报名', 'Think Pink バスケ大会の申し込み', 'Think Pink 농구 대회 신청'),
    starts: TOURNAMENT.start,
    until: TOURNAMENT.signupUntil,
  },
  {
    // Once sign-ups close, the cover points to the final.
    href: '#/basketball',
    title: tx('Think Pink Basketball final', 'Think Pink 篮球赛决赛', 'Think Pink バスケ大会 決勝', 'Think Pink 농구 대회 결승'),
    starts: TOURNAMENT.end,
    startsKey: 'now.final',
    until: TOURNAMENT.end,
  },
  {
    href: '#/join',
    title: tx('Submit your work', '投稿', '作品を投稿する', '작품 투고하기'),
    needsForm: true,
  },
];

// Spirit Week. Every fact comes from the school: the Spirit Week poster in the
// Daily Bulletin (ManageBac, 24 Sep), Ms Rimmer's email of 20 Sep (banner
// painting, chants, sports shirts) and Ms Cindy's list of 21 Sep (Sports Day,
// 2 Oct). The athletes are four Paris 2024 Olympians in four sports, each a
// frame sequence cut out of a video on Wikimedia Commons (img/spirit/<id>/);
// the sports do not have to match the games. frames, w and h describe the
// sequence; peak is the frame shown when motion is reduced; ax is where the
// body sits across the frame. A day's lane can use its own cut (lane).
export const SPIRIT = {
  start: '2026-09-28',
  end: '2026-10-01',
  sportsDay: '2026-10-02',
  days: [
    { date: '2026-09-28', house: 'yellow', athlete: 'discus', game: tx('Tug of war', '拔河', '綱引き', '줄다리기') },
    { date: '2026-09-29', house: 'blue', athlete: 'sabre', game: tx('3-legged race', '两人三足', '二人三脚', '2인 3각') },
    { date: '2026-09-30', house: 'red', athlete: 'bmx', lane: 'bmxspin', game: tx('Hoop toss', '套圈', '輪投げ', '고리 던지기') },
    { date: '2026-10-01', house: 'green', athlete: 'bball', game: tx('Relay race', '接力跑', 'リレー', '이어달리기') },
  ],
  athletes: {
    discus: {
      frames: 26, w: 892, h: 760, peak: 16, ax: 0.519,
      name: 'Tom Reux',
      sport: tx('discus', '铁饼', '円盤投げ', '원반던지기'),
      video: 'Terre(s) de sport: Tom Reux',
      author: "Caisse d'Epargne",
      license: 'CC BY 3.0',
      page: 'https://commons.wikimedia.org/wiki/File:Caisse_d%27%C3%A9pargne_-_Terre%28s%29_de_sport_-_Tom_Reux.webm',
      licenseUrl: 'https://creativecommons.org/licenses/by/3.0/',
    },
    sabre: {
      frames: 31, w: 1000, h: 616, peak: 28, ax: 0.251,
      name: 'Sara Balzer',
      sport: tx('sabre', '佩剑', 'サーブル', '사브르'),
      video: 'Terre(s) de sport: Sara Balzer',
      author: "Caisse d'Epargne",
      license: 'CC BY 3.0',
      page: 'https://commons.wikimedia.org/wiki/File:Caisse_d%27%C3%A9pargne_-_Terre%28s%29_de_sport_-_Sara_Balzer.webm',
      licenseUrl: 'https://creativecommons.org/licenses/by/3.0/',
    },
    bmx: {
      frames: 26, w: 712, h: 1100, peak: 10, ax: 0.441,
      // In the hero he stops in mid-air, before landing on the fencer.
      heroTo: 18,
      name: 'Kieran Reilly',
      sport: tx('BMX freestyle', '小轮车自由式', 'BMXフリースタイル', 'BMX 프리스타일'),
      video: 'Paris2024 (extra)ordinary, episode 2',
      author: 'Nthn Creative',
      license: 'CC0',
      page: 'https://commons.wikimedia.org/wiki/File:Paris2024_-_%28extra%29ordinary_-_episode_2_kieran_reilly.webm',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    // The same flip, re-centred on the rider every frame, so he turns on the
    // spot inside Wednesday's lane instead of flying out of it.
    bmxspin: {
      frames: 26, w: 640, h: 640, peak: 10, ax: 0.5,
      of: 'bmx',
    },
    bball: {
      frames: 35, w: 697, h: 640, peak: 24, ax: 0.532,
      name: 'Laëtitia Guapo',
      sport: tx('3x3 basketball', '三人篮球', '3x3バスケットボール', '3x3 농구'),
      video: 'Terre(s) de sport: Laetitia Guapo',
      author: "Caisse d'Epargne",
      license: 'CC BY 3.0',
      page: 'https://commons.wikimedia.org/wiki/File:Caisse_d%27%C3%A9pargne_-_Terre%28s%29_de_sport_-_Laetitia_Guapo.webm',
      licenseUrl: 'https://creativecommons.org/licenses/by/3.0/',
    },
  },
};

export const TEAM_SIZE = 5;

// pool: homeroom teams are one class; grade teams draw from a whole grade.
// poolName fills "others from {pool}" in the sign-up form.
const G10_SUB = tx('Grade 10 homeroom', '10 年级班级', '10年生クラス', '10학년 반');
const homeroom = (id) => ({ id, label: id, sub: G10_SUB, pool: 'homeroom', poolName: tx(id, `${id} 班`, `${id}クラス`, `${id}반`) });
const grade = (id, n, example) => ({
  id,
  label: id,
  sub: tx(`All of Grade ${n}`, `${n} 年级全体`, `${n}年生全体`, `${n}학년 전체`),
  pool: 'grade',
  poolName: tx(`Grade ${n}`, `${n} 年级`, `${n}年生`, `${n}학년`),
  example,
});

export const TEAMS = {
  '10.1': homeroom('10.1'),
  '10.2': homeroom('10.2'),
  '10.3': homeroom('10.3'),
  '10.4': homeroom('10.4'),
  // G6 joined on 7 Oct and plays together with G7 (Cindy, via Steve and Sam).
  // The id stays G7 so earlier sign-ups keep their team.
  G7: {
    ...grade('G7', 7, '7.2'),
    label: 'G6/G7',
    sub: tx('Grades 6 and 7', '6、7 年级', '6・7年生', '6·7학년'),
    poolName: tx('Grades 6 and 7', '6、7 年级', '6・7年生', '6·7학년'),
  },
  G8: grade('G8', 8, '8.1'),
  G9: grade('G9', 9, '9.3'),
  FEP: {
    id: 'FEP',
    label: 'FEP',
    sub: tx('All of FEP', 'FEP 全体', 'FEP全体', 'FEP 전체'),
    pool: 'grade',
    poolName: tx('FEP', 'FEP', 'FEP', 'FEP'),
    example: 'FEP 1',
  },
};

// The games as they were played (Steve, 23 Oct): Tuesday 10.1 v 10.2, won by
// 10.1 11-9; Wednesday 10.3 v FEP, won by FEP; Thursday's game is still to be
// confirmed with Sam. No game on Monday. teams: null means not confirmed yet;
// score is [first team, second team]; winner is a team id.
const qf = (n) => tx(`Quarter-final ${n}`, `四分之一决赛 ${n}`, `準々決勝 ${n}`, `8강 ${n}경기`);
export const GAMES = {
  qf1: { name: qf(1), short: 'QF1', teams: ['10.1', '10.2'], date: '2026-10-20', winner: '10.1', score: [11, 9] },
  qf2: { name: qf(2), short: 'QF2', teams: ['10.3', 'FEP'], date: '2026-10-21', winner: 'FEP' },
  qf3: { name: qf(3), short: 'QF3', teams: null, date: '2026-10-22' },
  // No semi-finals (organisers, 22 Sep): the quarter-final winners are ranked
  // by the points they scored and the top two play the final. The final moved
  // from Friday 23 to Monday 26 October (organisers via Sam, 26 Sep), then to
  // Tuesday 27 October (Steve, 21 Oct).
  final: { name: tx('Final', '决赛', '決勝', '결승'), short: 'Final', from: ['qf1', 'qf2', 'qf3'], byPoints: true, date: '2026-10-27' },
};

// The quarter-finals in order (every game but the final).
export const QFS = Object.keys(GAMES).filter((id) => !GAMES[id].from);

// word: how the role reads inside a sentence ("You're down as a referee").
export const ROLES = [
  {
    // Four per game: Cindy's #10 BASKETBALL slide, confirmed by Steve (27 Sep).
    id: 'referee',
    need: 4,
    name: tx('Referee', '裁判', '審判', '심판'),
    plural: tx('Referees', '裁判', '審判', '심판'),
    word: tx('referee', '裁判', '審判', '심판'),
    words: tx('referees', '裁判', '審判', '심판'),
    does: tx('Run the game on court and call fouls.', '在场上执法、判罚犯规。', 'コートで試合を進行し、ファウルを判定します。', '코트에서 경기를 진행하고 파울을 판정합니다.'),
  },
  {
    id: 'scorer',
    need: 1,
    name: tx('Scorer', '记分员', 'スコアラー', '기록원'),
    plural: tx('Scorers', '记分员', 'スコアラー', '기록원'),
    word: tx('scorer', '记分员', 'スコアラー', '기록원'),
    words: tx('scorers', '记分员', 'スコアラー', '기록원'),
    does: tx('Keeps the score sheet, fouls and timeouts.', '记录比分、犯规和暂停。', 'スコア、ファウル、タイムアウトを記録します。', '점수, 파울, 타임아웃을 기록합니다.'),
  },
  {
    id: 'timer',
    need: 1,
    name: tx('Timer', '计时员', 'タイマー', '계시원'),
    plural: tx('Timers', '计时员', 'タイマー', '계시원'),
    word: tx('timer', '计时员', 'タイマー', '계시원'),
    words: tx('timers', '计时员', 'タイマー', '계시원'),
    does: tx('Runs the game clock: 4 quarters of 5 minutes.', '负责比赛计时：4 节，每节 5 分钟。', '試合時間を計ります（1クォーター5分×4）。', '경기 시간을 잽니다: 5분 4쿼터.'),
  },
];

// Every date with a game, taken from GAMES, so the scoreboard, the officials'
// form and the server (api/_store.js imports this) always follow the draw.
export const GAME_DAYS = [...new Set(Object.values(GAMES).map((g) => g.date))].sort();

// Background photos on the basketball page. Free licences only (Wikimedia
// Commons); every photo is credited at the bottom of the page.
// slot: top-left | top-right | left | centre | right. focus: CSS object-position for the crop;
// zoom enlarges around the focus point when the player is small in frame.
export const STAR_PHOTOS = [
  {
    slot: 'top-left',
    name: tx('Kevin Durant', '凯文·杜兰特', 'ケビン・デュラント', '케빈 듀랜트'),
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Kevin_Durant_dunk.jpg/960px-Kevin_Durant_dunk.jpg',
    page: 'https://commons.wikimedia.org/wiki/File:Kevin_Durant_dunk.jpg',
    author: 'Keith Allison',
    license: 'CC BY-SA 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    focus: '50% 30%',
  },
  {
    slot: 'top-right',
    name: tx('Victor Wembanyama', '维克托·文班亚马', 'ビクター・ウェンバンヤマ', '빅터 웸반야마'),
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Victor_Wembanyama_San_Antonio_Spurs_2024.jpg/960px-Victor_Wembanyama_San_Antonio_Spurs_2024.jpg',
    page: 'https://commons.wikimedia.org/wiki/File:Victor_Wembanyama_San_Antonio_Spurs_2024.jpg',
    author: 'Frenchieinportland',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    focus: '50% 22%',
  },
  {
    slot: 'left',
    name: tx('Stephen Curry', '斯蒂芬·库里', 'ステフィン・カリー', '스테픈 커리'),
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Stephen_Curry_shooting.jpg/1280px-Stephen_Curry_shooting.jpg',
    page: 'https://commons.wikimedia.org/wiki/File:Stephen_Curry_shooting.jpg',
    author: 'Keith Allison',
    license: 'CC BY-SA 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    focus: '50% 28%',
  },
  {
    slot: 'centre',
    name: tx('Kobe Bryant', '科比·布莱恩特', 'コービー・ブライアント', '코비 브라이언트'),
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Kobe_Bryant_7144_adjusted.jpg/960px-Kobe_Bryant_7144_adjusted.jpg',
    page: 'https://commons.wikimedia.org/wiki/File:Kobe_Bryant_7144_adjusted.jpg',
    author: 'Sgt. Joseph A. Lee, U.S. Marine Corps',
    license: tx('public domain', '公有领域', 'パブリックドメイン', '퍼블릭 도메인'),
    licenseUrl: 'https://commons.wikimedia.org/wiki/File:Kobe_Bryant_7144_adjusted.jpg',
    focus: '50% 22%',
  },
  {
    slot: 'right',
    name: tx('LeBron James', '勒布朗·詹姆斯', 'レブロン・ジェームズ', '르브론 제임스'),
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Lebron_dunking_%28cropped%29.jpg/960px-Lebron_dunking_%28cropped%29.jpg',
    page: 'https://commons.wikimedia.org/wiki/File:Lebron_dunking_(cropped).jpg',
    author: 'Erik Drost',
    license: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
    focus: '52% 42%',
    zoom: 1.45,
  },
];
