# Syntax work 0.8.0

**Meeting Date:** 26th May, 2026 - 9:45 AM

---

**Knut Sveidqvist** *[00:02]*: Fogel? Ja, för det flaggar det som en säkerhetsrisk och jag måste manuellt gå in och erkänna det varje gång. 
**José Fernández Alameda** *[00:14]*: Men jag har inte sett svenska i tyska noter. 
**Knut Sveidqvist** *[00:19]*: Nej, Tyskland kan inte hantera det. Det är därför jag använder eldflugor. Och det är allt. Det är här nu. Okej. Per, du var först med frågan om delstatens objekt. Jag försökte svara idag. Att delstaten är något vi kom på för att undvika att specificera vilken data som är en del av varje pil. Kunde vi liksom sätta det i ett gemensamt tillstånd och vi behöver inte presentera det i Dagen? 
**Per Cederberg** *[00:58]*: Jag tror att vad PAC gör är att bara ta det tidigare svaret och bara trycka in i nästa steg. Och sedan är det upp till varje stegs output från agenten, vad det än är. 
**Knut Sveidqvist** *[01:15]*: Ja, så det är ungefär det, men vi kan formulera det annorlunda. Så hur vill vi ha det? För antingen försöker vi modellera det i diagrammet eller så antar vi att det är standarden, men det går bara via data. Längs flödet. Jag tror att det är vettigt, för annars blir det så klumpat med alla detaljer så att man inte riktigt behöver för att avslöja det. 
**Per Cederberg** *[01:47]*: Exakt min tanke, ja. Jag ser inte ens hur vi kunde göra det strukturerat. Det är en LLM i bakändan och vi kan göra det utan Jason, men... 
**Knut Sveidqvist** *[02:03]*: Du vet... Ja, så... 
**Per Cederberg** *[02:10]*: Jag tänker mer att det är bättre att bara lämna det öppet och om du vill att en JASON-struktur ska gå från ett steg till ett annat, det är vad du skriver i din egen instruktion. Och diagrammet som sådant behöver inte fånga det. 
**Knut Sveidqvist** *[02:29]*: Ja. 
**José Fernández Alameda** *[02:30]*: Och för att förenkla. 
**Knut Sveidqvist** *[02:33]*: Det var det första steget här, där vi beskriver det som ett delat statsobjekt. Men vi kanske bara kan säga att om inte alla data från det tidigare steget specificeras till nästa steg, kan vi lägga till det i dokumentationen istället. Okej, bra. Jag kommer att uppdatera med det. Det blir det vanliga svaret här. Nästa. Du vill inte ha standardformen. Är det Hussein? 
**José Fernández Alameda** *[03:19]*: Nej, jag menar, den visuella formen tror jag är vettig. Det är bara sättet att... Det är dessa medel som jag tycker är problematiska. För jag fortsätter att glömma vad formen betyder. Och du vet, så när jag läser,. 
**Knut Sveidqvist** *[03:41]*: Jag vet inte, sub... 
**José Fernández Alameda** *[03:44]*: Runtdirekt, har jag svårt att förstå vad det är. 
**Knut Sveidqvist** *[03:48]*: Eller lean right. 
**José Fernández Alameda** *[03:51]*: Men jag menar, det är vettigt att ha en rekt. Det är bara det att i syntaxen. 
**Knut Sveidqvist** *[03:56]*: Jag vet inte. Vi kan ha en alias för det. Så det kallas form kolumn task. 
**José Fernández Alameda** *[04:04]*: Ja, ja, eller i en annan egenskap eller i ett nyckelord. Jag vet inte vad som är bäst. 
**Knut Sveidqvist** *[04:09]*: Det är bra att använda form. 
**José Fernández Alameda** *[04:15]*: Okej, det skulle vara bättre för retabilitet. Men jag vet inte vad Per och Ashish tänker om det. 
**Ashish Jain** *[04:23]*: Kan vi använda som implicita former bundna till nyckelorden, liknande som i tillståndsdiagrammet, vi kallar start och stopp, eller hur? Och de är bundna till start form och stopp form. Så kan vi ha, låt oss säga att vill ha en rekt eller rundad rekt form för en uppgift eller en subgraf form för en agent, vilket är en grupp, eller hur? Så i standard kommer de att falla tillbaka till rekt form och subrotein form, vad vi än kartlägger internt på DB-nivån, eller hur? Så att användaren inte har explicit rätt form kolon rekt i metadatan. Så det här är standarden och det här kan öppna upp denna sintex senare om de vill använda en annan form tillsammans. Så på den nivå som är mindre robust. 
**Knut Sveidqvist** *[05:18]*: Du menar. Jag menar, om vi går upp här, här är några exempel. 
**Ashish Jain** *[05:25]*: Ja. 
**Knut Sveidqvist** *[05:28]*: Så den här är en uppgift? Det här skulle också vara en uppgift? Ja. Och återigen en uppgift. Här har du ett beslut eftersom du har den. Standard mermit syntax för diamant. Och du kan också, antar jag, använda Om vi inte blockerar det, skulle det fungera. 
**José Fernández Alameda** *[06:03]*: Det är bättre att hitta bara ett sätt kanske, även om det är mer exklusivt. 
**Knut Sveidqvist** *[06:11]*: Jag vet inte. Grejen är att det här är hur Mermit fungerar. Och jag tror att det är vettigt att ha det som liknande som möjligt i nyckelmekaniken. Så vi gillar inte... Om något gillar jag det här mycket bättre än det här. 
**Ashish Jain** *[06:32]*: Ja, men i det här fallet är alla dessa... Låt oss säga att alla dessa är uppgifter, eller hur? Om du definierar en agent kommer du att börja med ett agenttangent. Detta är beslutet, men i grafen, vad det betyder. Är det en del av sig själv? 
**Knut Sveidqvist** *[06:57]*: Det är en diamantform. 
**Ashish Jain** *[06:59]*: Nej, jag pratar inte om formen. Jag pratar om kommer detta att behandlas? För som nu, vi pratar om alla de olika entiteter som vi har i grammatiken. Vi har en agent. Du börjar med en agent och sedan agentnamnet och sedan agent definitionen. 
**Knut Sveidqvist** *[07:14]*: Beslutsport. Granskning eller tricks. 
**Ashish Jain** *[07:25]*: Ja. Och beslut är inte en del av en uppgift. Då är beslut något som du tar mellan uppgifter. 
**Knut Sveidqvist** *[07:36]*: Här är ett exempel på vår status, skicklighet som vi använder. Ja. Här har vi ett beslut som kontrollerar om det finns en varning från att fiska data. Då går vi över till den vägen, annars går vi den vägen. Så det är inte en uppgift i sig. Selection of path. In the flow. Makes sense? Here is just how you make it happen. See if I can find the right. Here you can write it this way, or you can write it this way. Samma sätt. 
**Ashish Jain** *[08:26]*: Ja, så i det här fallet, som i båda exemplen, en är metadata-exemplet, den andra där du säger explicit formar beslut, eller hur? Så du vet att du ritar beslutsruta. Eller så har du implicit en syntex för beslutet, eller hur? Ja. Det är liknande att säga att beslut, liknande med, låt oss säga, Agent A, Agent 007, eller hur? Så Agents nyckelord anger att du vill rita vad som helst som är kartläggning till Agentschipet. Så i det här fallet är det Marmades Kirly Braces Syntex som definierar att det ska vara beslutslådan, eller hur? 
**Knut Sveidqvist** *[09:08]*: Ja. 
**Per Cederberg** *[09:09]*: Kan jag bara nämna här att vad Det vi spekulerar i hur man ska implementera är att vi planerar att använda en klassificerare för att bara främja det med resultatet, beslutet och de följande graferna och deras etiketter och möjligen instruktioner och sedan låta det välja. Och det är så logiken kommer att implementeras. Så för springaren spelar det egentligen ingen roll hur tejpen ser ut. Det kommer bara att vara texten i lådan. 
**Knut Sveidqvist** *[09:53]*: Jag tror att formen i sig måste ha ett värde för LLM också. Jag tror det. 
**Per Cederberg** *[10:02]*: För jag tänkte mer att... Om du har två utgående pilar, har du ett beslut. Det är det som utlöser det. 
**Knut Sveidqvist** *[10:12]*: Om det inte är ett beslutsruta, då skulle det vara parallellisering, eller hur? Ja, precis. Okej. 
**Per Cederberg** *[10:21]*: Så det är okej. 
**Knut Sveidqvist** *[10:23]*: Men jag tror att det kan instrueras till LLM. Jag tror det. Det är lätt för mig att säga att det inte behöver fungera. Men när jag tidigare har använt själva mermidiagrammet för att instruera Claude, så fungerar det riktigt bra. Det hanterar det. Det förstår det. Så genom att göra en primär från specifikationen tror jag att det kommer att hjälpa dem att förstå. Jag vet inte. Okej, ska vi fortsätta? Så det här är hur du kan ställa de olika formerna. Men vilka former behöver vi? Så vi har en uppgift. 
**Ashish Jain** *[11:23]*: Men håller vi med om den implicita kartdragningen? Är uppgift ett nyckelord eller inte? Är agent ett nyckelord eller inte? Eller använder vi formerna för att faktiskt... 
**Knut Sveidqvist** *[11:39]*: Agent är en grupp. Men... Dessa är inte nyckelord. Task är inte nyckelordet, eller hur? Dessa är former. Okej. 
**José Fernández Alameda** *[11:56]*: Men det är inte vettigt att gå till en komplett nyckelordssak. 
**Knut Sveidqvist** *[12:01]*: Då bryter vi med syntaxen. Jag menar, en av de... Grunden är att hålla detta så enkelt som möjligt för människor som kan Mermit och Flow Charge Syntax, att både läsa och skriva detta. Och med denna enklare syntax tror jag att det är ganska enkelt. Eftersom det inte finns så många former. Vi har en fråga. Ett verktyg. Input. Vi kan diskutera input om vi verkligen behöver det. Referensdokument. Här har vi saker vi behöver klara ut. Vad vi gör med... Jag tror inte att de är klara. De här är enkla. Kanske hoppar vi över den här. Om vi inte behöver den. Men låt mig visa er, vi modellerade en färdighet som vi faktiskt använder idag. Där vi varje dag kollar vad som har hänt i projektet i Mermit Open Source. Så då i tidsfönstret... Nästa, sista. 
**Knut Sveidqvist** *[13:23]*: Ja, jag trodde att jag ens klickade på knappen, men jag klickade på sluta dela. 
**Ashish Jain** *[13:31]*: Ja, medan du delar, bara för att förtydliga, på formfronten, om vi håller oss till den nuvarande syntex, då kan vi åtminstone lägga till den övriga höger. Att istället för att göra för verktyget, istället för att säga form subrutin, kan vi fortfarande säga formverktyget. Så det är tydligt och klart. Då pratar vi om ett verktyg, eller hur? 
**Knut Sveidqvist** *[13:57]*: Ja, definitivt. Så vi kallar det AST 2 input. Och här kanske en reftoc. Ja, så här är diagrammet vi skapade igår baserat på det. Vi gjorde det med AI. Från färdigheten. Och insåg medan vi gjorde det, två saker. A) att färdigheten som vi hade skapats från instruktioner via Claude, hade strukturella problem. Så vi hittade faktiskt problem genom att göra detta. I den befintliga färdigheten. Det fungerar fortfarande tack vare LLM:s motståndskraft, men vi hittade strukturella problem i det. Så det var en bra, en av dessa markörer att vi är på väg mot något här. Eftersom det är så lätt att se. De olika stegen och du kan se vad den gör på ett väldigt annorlunda sätt. Även om både jag och Ashish är ingenjörer med lång erfarenhet, missade vi fortfarande det tills visualiserade det. Då fick vi lite problem med... Så den här använder... 
**Knut Sveidqvist** *[15:20]*: Slack post-kunskap för att posta på Slack. Så vi använder inte bara en MCP-server, vi använder en NCP-server med instruktioner och lite extra i den. Så det här är vad den färdigheten är, Comp/Slack Post. Så det tar inputargument. Och sen har vi ett referensdokument här. Med beskrivning för LLM hur ville skriva. Så om det är i Team Channel inom Slack har den använt Terry Pratchets röst. Lite roligt. Du måste ha roligt i ditt liv. Och om det är i öppen källa så är det varmt. Men direkt till externa människor. Så det är vad som finns där. Och vad vi fastnade lite med, att vi liksom inte riktigt hade formen. Så här betyder detta proximport. Så den här är en referens till den andra filen. Så vi kan bestämma att i det första stadiet för Alfa använder vi inte importerade. 
**Knut Sveidqvist** *[16:45]*: Vi har bara en fil som innehåller allt. Men i praktiken har vi kanske 30 olika färdigheter som refererar varandra i projektet. Så att ha allt det i ett kommer inte att fungera i längden, men för alfa kan vi göra det. Hur som helst, så här, vilken form borde vi ha? A) Vi har ingen form av färdighet. Så det här skulle verkligen vara en färdighet, och det här borde typ betyda att det är en import. Det kan vi inte riktigt modellera just nu, så vi använde importformen som vi har, proxen. Eller det. Det var samma sak med den här faktiskt. Och sedan använde vi subgrafen bara för färdigheten själv. Så i det här. 
**Ashish Jain** *[17:44]*: Fallet, de två exemplen, ett där vi har skapat färdigheten som externa referens. Exemplet med instansen av så att du definierar det på ett ställe och sedan använder du det bara i grafen som enda låda, men det kan vara flera saker inuti den. Och det andra exemplet är hur det skulle se ut om du inte har en extern referens och bara använder hela flera multiboxen. Som vilken färdighet som helst, en färdighet kan göra komplicerade saker, eller hur? Det kan vara bara enda uppgift eller så kan det ha flera saker kopplade till den. I det här fallet skapar den ett diagram, trycker på att publicera det med en MCP server och sedan lägger den upp det på. 
**Knut Sveidqvist** *[18:28]*: Slack. Jag får inte det här dock. Det här är ett referensdokument till en uppgift här. Och uppgiften, varför är det ett prox? Och. 
**Ashish Jain** *[18:45]*: Formen är fel i det här fallet. 
**Knut Sveidqvist** *[18:51]*: Vi insåg också att vi har det på vår lista för att få raderna korrekta eftersom det är ganska svårt att redigera här nu för att hitta rätt ställe. Där är det. Och det borde räknas. Kanske. Så det är en vanlig uppgift. 
**Ashish Jain** *[19:36]*: Rundat tror jag. Okej. Subroteinet med en prick betyder att det är en MCP-anslutning baserad. 
**Knut Sveidqvist** *[19:49]*: På TASC eller KNOT. Subroteinet, ja, prickarna som vi borde ta bort. Glöm oss aldrig. Jag tror att det var en inledande sak att lyfta fram fel eller något men. Det är inte färdigt. Jag tar bort det. Vi gör det ordentligt. Så här är två verktygslådor. Det här är en för... För... Ja, vad är det här? Kreata Mermit Chart Diagram. Är det också en färdighet? 
**Ashish Jain** *[20:30]*: Det här är MCP-verktyget. Det här är Mermit Chart MCP. Hon använder Mermit Chart MCP och det är ett verktyg inom det. Eller en kod i MPT-servern. 
**Knut Sveidqvist** *[20:45]*: Och då använder den länken eller referensen för att posta. 
**José Fernández Alameda** *[20:49]*: Jag tänker bara, om ett verktyg, det enda den gör är att prata med en MCP, kan det inte göras av en. 
**Knut Sveidqvist** *[20:58]*: Uppgift då? Och det är trevligt att kunna se i diagrammet här att det här är något externt från. 
**José Fernández Alameda** *[21:08]*: LLM. Ja, men det borde göras av anslutaren istället. 
**Knut Sveidqvist** *[21:16]*: Jag tror att det här är en inställning av kontakten. Vi pratade om det. Här kommer det att vara i rutan. Föreställ dig att det här är grönt med en i. Och här kommer denna punkt att vara grön med en i. Så du ser att den här kontakten är knuten. Men jag menar,. 
**José Fernández Alameda** *[21:41]*: Det kan vara gjort, kanske NO8 är gjord. Som när du hoverar på saken kan du se små ikoner för de verktyg som är anslutna till och sånt. Så då kan du kanske klicka där och linjerna blir fel eller något. 
**Knut Sveidqvist** *[21:52]*: Sådant. Jag vet inte, det behöver inte vara anslutet hela tiden, antar jag. Ja, vi kommer att göra det. Här, åtminstone. Du med blicken kommer att kunna se att det här är ett verktyg. 
**Ashish Jain** *[22:07]*: Och du kan se vilken. Rent visuellt kan vi fortfarande göra ändringar. Det viktigaste är från ett implementeringsperspektiv. Kommer detta att vara vettigt att vara en del av diagrammet? Titta inte på själva diagrammet, men om du tittar på definitionen på höger sida i koden, kommer det... Hjälpa till att faktiskt kunna hålla det faktiska samtalet? En sak är att faktiskt säga att det här är min MCP server, så Mermit-kartan är en MCP server som har exponerade funktioner, som det finns typ 10 olika funktioner som du kan göra, eller hur? Du kan skapa ett nytt diagram, du kan redigera ett diagram, du kan radera ett diagram, så det finns olika funktioner som du kan göra. Och i det här fallet använder du skapa-funktionen i Mermit-kartan. 
**Ashish Jain** *[22:55]*: Så kommer denna definition att krävas eller kommer LLM vara smart nog att veta att okej, om jag måste använda Mermit Chart MCP och de säger att de måste skapa ett diagram, kommer jag att använda denna relevanta färdighet. Så vad som är mer relevant ur ett implementeringsperspektiv kommer att avgöra nivån på detaljerna vi måste sätta in i diagrammet. När jag. 
**Per Cederberg** *[23:21]*: Ser det här, vad jag ser är att det vi måste göra är att sammanställa detta till faktiska instruktioner där vi säger något till LLM att du ska... Här är lite text och du ska göra en och sedan kalla det här verktyget och sedan kalla det verktyget och vi ska tillhandahålla den texten i princip. Ja. Och sedan hoppas att det här är vad som händer. Men du kan också skriva det i fritext i toppboxen, "Behövs responskampanj". Du kan bara skriva instruktionen där och den borde ha samma verktyg tillgängliga, eller hur? Eftersom det är i agenten och verktygen är bundna till agenten, eller. 
**Knut Sveidqvist** *[24:03]*: Hur? 
**Per Cederberg** *[24:05]*: Och det här menar du? Jag är bara, kontakterna är bundna till agenten, eller hur? Eller. 
**Knut Sveidqvist** *[24:16]*: Är de bundna till... De är bundna till... De är som en global konfiguration för. 
**Per Cederberg** *[24:20]*: Hela saken. Ja, så alla steg kan kalla alla kontakter här om vi bara använder en agent. Ja. Så i min text här där det står "Behöver respons, kan" om jag tillhandahöll en mer... En textgrej att kalla detta. Använda Mermage Chart-verktyget och Slack Reply Thread-verktyget i texten. Det skulle göra samma sak, eller hur? Ja. Så. 
**Ashish Jain** *[24:48]*: Du menar att det är. 
**Per Cederberg** *[24:48]*: Ett alternativ att modellera det eller inte. 
**Ashish Jain** *[24:53]*: Ja. Ja. Istället för lådor, om du bara skriver det i enda mening som använder det här och det här. Och så det borde fungera. 
**Knut Sveidqvist** *[25:04]*: Tekniskt. Så du menar använda... 
**Per Cederberg** *[25:10]*: Nej, för det är så vi ska implementera det. Vi måste implementera det genom att återprompta, generera prompten och hoppas på det bästa. 
**Knut Sveidqvist** *[25:23]*: Så det är ett annat alternativ. Du ser inte... Här har vi ett konstant krig. 
**Per Cederberg** *[25:31]*: Här tror. 
**Knut Sveidqvist** *[25:31]*: Jag. Om du går till ena änden av spektrumet har du en markeringsfil. Allt är en radge framför. Och om du går till andra änden av spektrumet är allt kartlagt i diagrammet. Så vi måste hitta rätt balans. Jag skulle vilja pausa det här lite, om det inte verkligen behövs för syntax delen, för här är vi på väg in i semantik. Så det är kanske den mest komplicerade biten. Jag tror att det kan behöva sin egen session där vi definierar var vi sätter den här. Har vi prompt för allt? Do we have... How do we model... The metadata? How do we define, clarify that this is semantically correct versus syntactically correct? We talked about this the other day, that you could have a diagram that is okay syntacticly, but it doesn't mean anything. 
**Ashish Jain** *[26:43]*: Ja, jag tror att det i det här fallet också skiljer sig mellan vad som är vårt primära användningskas för röjningsflödet, för Elfa, eller hur? Vi har mycket mer detaljer i det här eftersom det här faktiskt försöker återskapa ett existerande system som vi har, eller hur? Vi har alla dessa agenter och färdigheter definierade och vi har alla tillkännagivanden definierade i systemet. Så den vet exakt som att skapa Marmit-chart-diagram eller Slack-tråd. Den har alla dessa detaljer och den modellerar diagrammet. Men om du gör det här åt andra hållet, som demon som du visade för investerarna, eller hur? Du ger bara en initial prognos att jag vill fånga information från GitHub. Publicera det i en rapport och till Slack, skapa ett can-bun diagram och sedan publicera det i Slack, eller hur? 
**Ashish Jain** *[27:41]*: Du kommer att ge detta som input och sedan förväntar du dig AI att komma med ett diagram. Och jag tror i så fall kommer det kanske inte att gå i denna nivå av detaljer. Det kan gå baserat på hur. 
**Knut Sveidqvist** *[27:54]*: Vi instruerar det att göra. Ja, jag tycker att vi borde sikta på att förstå det, särskilt i början nu. Ja. För jag kan se hur AI kommer att användas i ett senare skede, men det är bra att veta att den gör det ville göra innan vi bara kastar den på AI:n och ser vad som stannar. Det verkar. 
**Ashish Jain** *[28:18]*: Fungera. Ja. Nej, men när du sa att hitta rätt balans, håller jag med. Men jag tror att det skulle, för i båda fallen kommer det att skilja sig, eller hur? För om du har alla sammanhang, då kommer AI att ge dig en mer detaljerad diagram, som i det här fallet. Ja,. 
**Knut Sveidqvist** *[28:34]*: Men också inte nödvändigtvis bättre. Och det skulle vara bra om du tittar på diagrammet här. Bara visuellt. Det jag gillar med detta är att det är väldigt okomplicerat. Du kan följa flödet. Här är det lätt att se vad verktyg kallar för att göras. Och... Du kan visuellt dela det här på ett väldigt bra sätt. Syntax, jag tror att vi har... Några problem fortfarande. Men det... Vi löser det när vi har fått igenom det. Semantiskt har vi... Vi har ett jobb. Och sedan måste det göras. Jag tror kanske inte att det finns bara en lösning heller. Jag tror att det är vettigt att ha prompten... I alla former i princip. Så om du har prompten när du sammanställer den så använder du den. Och om... Jag antar att du kan få olika instruktioner som är i konflikt med varandra också. 
**Knut Sveidqvist** *[29:50]*: Men du kan skriva det i prompten också. Gör det här med text. Så det är... Jag tycker. 
**Per Cederberg** *[29:58]*: Att prompten är avgörande för att fixa... Things that break. So it's a hidden fix. 
**Knut Sveidqvist** *[30:07]*: Ja, when you take it, you work with it, if you run it doesn't work and then you can go in and trick the prompt. I agree. So I think it's also fine that different people will do it in different way depending on what... Hur de fungerar. Så någon kanske vill visa saken som ett uttryck för verktygskall. Någon annan... Tänker på ett annat sätt, blandar bara färre lådor med större prompter. Och jag tror inte att med den här inställningen, att systemet nödvändigtvis inte är ett problem. Eller hur? Men en sak vi kämpade med var bristen på form av färdighet. Varför? Vi ville ha det. Det var naturligt att använda formen av färdighet här. Den här är bara en tonsk. Varför. 
**José Fernández Alameda** *[31:21]*: Inte en uppgift? 
**Knut Sveidqvist** *[31:23]*: Jag menar, vad var skillnaden? Jag tänker. 
**Per Cederberg** *[31:25]*: Bara att färdighet är ett arbetsflöde, eller hur? Men i text? Ja. Så vad försöker du säga är att du refererar. 
**Knut Sveidqvist** *[31:33]*: Ett annat arbetsflöde? Ja, jag menar, i vår färdighetsfil, refererar vi andra färdigheter. Ja, precis. Så. 
**Per Cederberg** *[31:41]*: I våra work flows måste vi. 
**Knut Sveidqvist** *[31:43]*: Referera andra work flows. Ja. Ja. Jag. 
**José Fernández Alameda** *[31:49]*: Tycker att det är vettigt här. Jag vet inte. Färdigheten är vad agenten. 
**Knut Sveidqvist** *[31:53]*: Kompenserar för. Nej? Ja. Men jag misstänker att många av användarna kommer att ... Förvänta sig att hitta färdigheten. 
**José Fernández Alameda** *[32:11]*: Det är ett antagande, jag vet inte. Skulle inte det inkludera mycket komplexitet? Jag menar, det kommer att vara lätt att lägga till senare. Jag skulle inte tänka på färdigheter här. 
**Knut Sveidqvist** *[32:24]*: Skulle det här istället vara ett flöde, kanske? För dig? Exakt. Om det är komplext. 
**José Fernández Alameda** *[32:32]*: Nog kommer jag att sätta in det i en annan agent. 
**Knut Sveidqvist** *[32:36]*: Kan ett flöde ha som referenser? Saker i det, jag antar att du kan det. Då är det okej. Då är det samma sak. 
**José Fernández Alameda** *[32:46]*: Jag. 
**Per Cederberg** *[32:46]*: Tänker mer som, vad vill göra i framtiden är att ladda upp din skicklighet här och sedan, bang, du får ditt arbetsflöde. 
**José Fernández Alameda** *[33:00]*: Ja. Det kommer att vara mer vettigt. Så. 
**Knut Sveidqvist** *[33:03]*: I det här fallet kommer det publicerade svaret. Du ser, det här dödar mig. Så om vi gör ett flöde kanske det är bra. 
**José Fernández Alameda** *[33:28]*: Men vi introducerade flöde igen, sa vi inte att agent var en behållare av. 
**Knut Sveidqvist** *[33:33]*: Enheter som fungerar? Jag har inte ändrat syntaxen än. Ja, så kanske agent, då är det lite mindre. Så då är allt agenter, men agenter har lite av en personlighet, eller hur? Ska vi gå tillbaka och byta från agent till? Ingen stark opinion för mig, det är bara det. Jag har inget emot. Jag. 
**José Fernández Alameda** *[34:01]*: Tror att så länge vi bara använder en. Kanske för simplifiering nu och sedan om vi känner att vi måste introducera en. 
**Knut Sveidqvist** *[34:09]*: Annan. Ett annat koncept senare. Och här... Vi. 
**José Fernández Alameda** *[34:20]*: Måste flöda istället för agent. Så vi har flöde och vi har uppgifter. 
**Knut Sveidqvist** *[34:28]*: Ja. Agenter är också lite... Implementation beroende på ruttiden. Om vi går med flöde och uppgifter är vi... Väldigt generisk, vilket är bra. Okej, så det här är fortfarande 0,6 syntax där allt är möjligt. Okej. Så den här då, som referenser, ska vi tillåta? Olika... Importeringar från Getgo eller ska vi i princip flytta in? Flytta in den här. Ja. Kan göra. 
**Ashish Jain** *[35:17]*: Det. Jag menar, när du... Jag antar. Och om du har... För i det här fallet har du kört ut det till två filer, eller hur? Två, två diagram och ett diagram är syftet med det andra verktyget. Ja. När du körde det här skulle du passera data eller båda diagramtyperna, eller hur? Så du vet, det här är ett, och om det sedan är referens, då skulle du veta att okej, för just den här biten måste jag hänvisa till det andra. 
**Knut Sveidqvist** *[35:49]*: Diagrammet. Den enkla, den enkla undanflykten. 
**Per Cederberg** *[35:54]*: Här är att bara bestämma att en agent flöde är kallbar via Mermaid MCP. Och då. 
**Knut Sveidqvist** *[36:04]*: Kan du kalla din... Vad, om en agent flöde kallas av? 
**José Fernández Alameda** *[36:11]*: Jag fick inte. 
**Per Cederberg** *[36:11]*: Den. Av. 
**Knut Sveidqvist** *[36:12]*: Mermaid MCP. Och då skulle det vara ett verktyg. 
**José Fernández Alameda** *[36:17]*: Så då är det. 
**Per Cederberg** *[36:17]*: Bara ett verktyg som används. Du vill bunta, du vill ansluta flera flöden så här. Det. 
**Knut Sveidqvist** *[36:25]*: Är bara att, okej. 
**Per Cederberg** *[36:29]*: Då behöver vi inte riktigt bygga det än. 
**Knut Sveidqvist** *[36:35]*: Ja. Så ska vi göra. 
**José Fernández Alameda** *[36:36]*: Det? Att flödena avverkas av en MC. 
**Knut Sveidqvist** *[36:40]*: Du får en ny instans i runtid, antar jag. Vid den tidpunkten. Om du kallar den via MCP. Så då kommer runtiden att plocka upp det diagrammet och utföra det baserat på de data som kommer i samtalet från orkestratörsprocessen. 
**José Fernández Alameda** *[37:05]*: Förlåt, jag tror inte att jag fick den delen. 
**Knut Sveidqvist** *[37:11]*: Vi avslöjar alla. 
**Per Cederberg** *[37:13]*: Agentflöden som mcp nåbara. Åtminstone internt. Så när du vill ringa ett annat verktyg från... Du gör bara en mcp-ringning till Mermaid MCP-servern för din kända. Other workflow. Than provide. 
**José Fernández Alameda** *[37:34]*: Whatever. Istället för att använda prox för att inkludera. 
**Per Cederberg** *[37:38]*: Och stanna så. Istället för inkludera ringer vi bara MCP. Det. 
**José Fernández Alameda** *[37:44]*: Är mer vettigt. Ja, det är renare. Det är elegant. 
**Knut Sveidqvist** *[37:47]*: Jag gillar det. Annars är det andra alternativet att sätta in det här och bara ha en fil för alfa. 
**Ashish Jain** *[37:59]*: I det fallet, skulle du inte behöva en referens till den kallelsen? Om jag gjorde det här, skulle du förvänta dig initiala prompet som användaren gav för att generera flera arbetsflöden och ha en referenskallel mellan dem via MCP? Ja. Men det här är. 
**Knut Sveidqvist** *[38:25]*: Vad jag gillar med Pers idé här är att du inte behöver referenser. 
**Ashish Jain** *[38:30]*: Heller. Nej, men du refererar via MCB, eller hur? Du ringer fortfarande namnet. Du kommer att säga att jag vill... 
**Knut Sveidqvist** *[38:38]*: Ja, men vi behöver inte instanssyntax. 
**Ashish Jain** *[38:42]*: Nej, det behöver vi inte. Det förenklar och det är renare när det gäller... Syntexdeklarationen, ja. Jag tänkte mer på den faktiska implementeringen. 
**Knut Sveidqvist** *[38:55]*: Nu. Ja. Någon annan löser det. Ja. Ja. Frågan är om vi ska ha en annan form för det. Det finns en skillnad om man kallar det reguljär kunskap, reguljärt verktyg, som är lågnivåfattningar och den här som är din egen. Och jag tror att med detta förenklar vi så mycket så vi har mentalt utrymme för för en subproc eller något. Jag kommer inte ihåg. Hur som helst. Jag föreslår att jag kommer på en annan form för med dessa specialfall? Detta. 
**Ashish Jain** *[40:06]*: Kommer att ha ett problem med diagnostik. Eftersom du har olika arbetsflöden i olika filer och du ringer dem via Mermid MCP, vet du inte om de har skapats eller om någon gör en förändring i namnet eller syntex. I diagnostiken skulle du inte veta om Det finns på den. 
**Knut Sveidqvist** *[40:30]*: Men jag är säker på att José kommer att hitta en superbra UI att välja när du ställer upp saker. Jag har. 
**José Fernández Alameda** *[40:39]*: Verkligen några idéer. 
**Knut Sveidqvist** *[40:42]*: Det är mycket för användarna. Det finns en dynamisk lista över de olika färdigheterna som du har definierat. Så det... Exakt. Det var en... Jag har. 
**José Fernández Alameda** *[40:59]*: En snabb fråga bara för att, för den delen fick jag inte. Så, så kontaktkoderna är under en subgraf, men de använder inte någon form, - Keyword. 
**Knut Sveidqvist** *[41:09]*: Eller något. Hur identifierar de sig? Jag tror. 
**Ashish Jain** *[41:14]*: Att vi diskuterade det som en del av V. 08, Connectors would be like a dedicated one. This is just to show them on the graph. This is the old syntax that they are behind the graph. Thank you. 
**Knut Sveidqvist** *[41:29]*: And I think we could also read a bit different. I'm thinking maybe we should just put them on top of each other. Good. 
**José Fernández Alameda** *[41:38]*: No, just because it stroke me and I was a little confused. Okay. Tack. Så vad har vi kommit överens om. 
**Knut Sveidqvist** *[41:47]*: Angående typerna? Ja. Så ... Vi är tillbaka här. Nu pratar vi om formtyper. 
**José Fernández Alameda** *[42:00]*: Ja, typer i allmänhet, bara så att vi kan ... Så. 
**Knut Sveidqvist** *[42:04]*: Vi kommer att ha Ja, så vi måste gå igenom de vi kan skippa och de vill behålla. Referensdokument. Så en uppgift vill ha, ett verktyg vill ha. Och jag antar att vill ha en ny här. MCP. Låg rop. Vad pratade vi om nyss? Vad ska aliasen i formen vara för det? Som beslutsfattande. Här har vi. Men kommer. 
**José Fernández Alameda** *[43:03]*: Det att bli en helt ny form? Eller kommer det bara att. 
**Knut Sveidqvist** *[43:06]*: Vara? Jag tror att det är vettigt att ha ett annat form för det. För jag skulle vilja se det i diagrammet. Men det här är en färdighet, inte ett lågnivåverktyg. Subflow. Subflow. Vi kan ändra det senare. Bara en nyckeländring. Okej, så det här är bra. Sen har vi input. Om vi tittar på vårt diagram var det verkligen hjälpsamt att ha ett praktiskt exempel att arbeta med. Här har vi tidslinjen som en input till den här flöjten. Är. 
**Per Cederberg** *[44:05]*: Inte inputen som om den existerar, är det startrutan? Eller en av de två. 
**José Fernández Alameda** *[44:11]*: Startboxarna. 
**Knut Sveidqvist** *[44:16]*: Ja. Jag kan se en trigger också. Ja. Jag. 
**Per Cederberg** *[44:22]*: Tänker också att på. 
**José Fernández Alameda** *[44:23]*: Ett. 
**Knut Sveidqvist** *[44:24]*: Sätt ... 
**Per Cederberg** *[44:26]*: Vissa typer av triggers är lite ur skala, som webbhooks till exempel är den uppenbara triggern. Det är verkligen, du vet, det är inte i... Det behöver inte vara i Agent Flow Spec som du utlöser det via en webhook. Du kan utlösa vilket flöde som helst via en webhook. Uppenbarligen kan du modellera det om du. 
**Knut Sveidqvist** *[44:48]*: Vill, men jag tror att vi är tillbaka. 
**Per Cederberg** *[44:51]*: Igen till en av de... Det är förmodligen. 
**Knut Sveidqvist** *[44:54]*: Alternativ. Om du vill. 
**Per Cederberg** *[44:56]*: Modellera det, om du inte... Det viktiga för oss är bara att veta var vi ska börja. 
**Knut Sveidqvist** *[45:08]*: Så ska vi göra en startform istället då? En generisk som kan vara antingen trigger eller input eller. 
**Per Cederberg** *[45:21]*: Bara... Jag menar, i de vanliga flödesräkningarna finns det inte bara en... Bullet. 
**Knut Sveidqvist** *[45:26]*: Start point. Ja. Eller... 
**Per Cederberg** *[45:38]*: Ja. Men jag menar, ja, det är intressant att förklara input på något sätt för synlighet och klarhet så att du. 
**Knut Sveidqvist** *[45:46]*: Förstår. Ja. Så... Har vi en uppsättning startformer då? De kan börja med en input, de kan börja med triggern eller så kan de bara börja med en ruta för då måste du klicka på manualen. Eller ska vi bara ha den ena och Kanske vi ... Använder stadiumformen... 
**Ashish Jain** *[46:26]*: För huvudflödet ska det inte vara en del av diagrammet, eller hur? Jag tror att. 
**Knut Sveidqvist** *[46:35]*: Det är vettigt att se det. När. 
**Ashish Jain** *[46:38]*: Du klickar på spring, för jag antar att hela triggern som du kan fästa, som manuell körning, du har den här gröna knappen för att köra agent flödet, eller hur? Och sedan kör den bara din huvudagent. Om det finns någon annan trigger som du har för det, borde vara en del av triggern. Det är utanför, för i det här fallet är det skopat till. 
**Knut Sveidqvist** *[46:57]*: Detta enda flöde, eller hur? Vad menar du? Det är nästan som en anslutare, menar du? Ja, men. 
**Per Cederberg** *[47:06]*: Jag säger, jag tror, om jag förstår dig rätt, Ashish, du menar att triggern själv, definitionen, inte är en del av... Det är här visuellt, men definitionen är faktiskt i hårdheten eller i runtiden eller vad. 
**Knut Sveidqvist** *[47:20]*: Du kallar. 
**Ashish Jain** *[47:20]*: Det. Ja. Det. 
**Knut Sveidqvist** *[47:21]*: Är där. 
**Per Cederberg** *[47:21]*: Du sätter in de faktiska triggern och... 
**Ashish Jain** *[47:25]*: Ja. Jag menar, det skulle vara en annan sektion helt och hållet, enligt min åsikt, som om jag vill se tidigare körda historier, om jag vill se utåt från en tidigare avföring eller skapa en "crown tab" för vad det nu är. Inputen i det här fallet är viktig eftersom det är en nödvändig parameter för att faktiskt börja. Det här är som en statuscheck, så det behöver hur många dagar du vill täcka i statuschecken, eller hur? Så det här är något som du behöver för att driva verktyget. Det är inte riktigt en utgångspunkt för oss. 
**Knut Sveidqvist** *[47:58]*: Ja. Så. 
**Per Cederberg** *[47:59]*: När vi sammanställer detta, eller när vi förbereder detta, den här prompten till agenten här är att verifiera att du har den här inputen. Det är vad input box genererar i. 
**Ashish Jain** *[48:10]*: Instruktioner. Ja. För den dynamiska inputen, förväntar vi oss att under körningen kommer användaren att visas som en dialog för att sätta in sina prompter eller vad det nu är. Den dynamiska konfigurationen. Om de inte har en standard. That. 
**Knut Sveidqvist** *[48:24]*: They can go with. Okay, so it seems like we want to keep input then. Makes sense. Do we want to have a start shape, a generic one, or can we live without it? Do we always start with the... Because if we don't have an input, where do you start? Yeah,. 
**José Fernández Alameda** *[48:44]*: You need an input and an output to indicate also to the UI what is expected. Så vi måste åtminstone gå igenom trädet och se att. 
**Knut Sveidqvist** *[48:55]*: Det inte finns någon input eller output. 
**José Fernández Alameda** *[48:57]*: Antingen som en varning eller fel. För annars, vad producerar vi? Men det borde vara på toppnivå, eller hur? 
**Knut Sveidqvist** *[49:10]*: Ja, så här är slutet. Är när du når den sista boxen i flödet. Du behöver inte den specifika utgången. Men skulle. 
**José Fernández Alameda** *[49:24]*: Du säga att input och output är bara tillgängliga vid flödnivån? Och inte inne i flödet? 
**Ashish Jain** *[49:33]*: Jag menar, de kan vara tillgängliga i själva uppgiften, eller hur? Om du tar en notering,. 
**Knut Sveidqvist** *[49:40]*: Data,. 
**Ashish Jain** *[49:40]*: Att den faktiskt är referensera ett skript för att veta vad man ska fånga och hur man ska fånga, som prompten. Allt finns som referens i den filen. 
**José Fernández Alameda** *[49:53]*: Ja, men inputen, om du lägger en. 
**Knut Sveidqvist** *[49:54]*: Input i mitten av. 
**Ashish Jain** *[49:55]*: Ett. 
**Knut Sveidqvist** *[49:55]*: Flöde, hur hanterar du det? 
**Per Cederberg** *[50:00]*: Det genereras som en prompt till agenten för att verifiera att denna input existerar. Ja, från. 
**Knut Sveidqvist** *[50:08]*: Det tidigare steget. 
**Per Cederberg** *[50:12]*: Ja. Och sedan i princip när vi kör en, jag menar, vad vi kan göra i redaktorn, att när du kör något med inputboxar som vi ber om värdena för. 
**José Fernández Alameda** *[50:22]*: Dem. Men om inputen är: ge mig ... Jag vet inte, något för hand. Human. Kommer vi att i mitten av flödet fråga. 
**Knut Sveidqvist** *[50:36]*: Om det vanliga? Vi kommer att misslyckas. 
**Per Cederberg** *[50:38]*: Med flödet om vi inte har det värdet när vi kör det. Och när du kör det måste du antingen tillhandahålla en webhook-samtal med de värdena i den. Eller när du, som när du utlöser arbetsflödet, alla input måste vara tillgängliga. 
**Knut Sveidqvist** *[50:55]*: På utsidan. Nej, precis. Jag menar,. 
**José Fernández Alameda** *[50:59]*: Vi kan gå igenom hela trädet och samla in alla input och se. Nej, från användaren. 
**Knut Sveidqvist** *[51:07]*: Så säg här att vi. Jag antar. Om du behöver verifiera data i flödet. Du kan använda diamantformen. Här kollar vi om det finns varningar. Vi kan kolla om vi fick mer än 10 resultat. Annars var det input-kravet. Så kanske behöver vi det inte inuti flödet, utan mer som krav på starten. Och om det är ett strikt krav fyller vi i diagrammet när vi kör det. Och jag antar att vi skulle vilja visa det i UI:n när du redigerar också. Tillbaka till dokumentet. Om vill ha inmatningsfältet. Det är ett felaktigt dokument. Om vill behålla inmatningsfältet, men vi kallar det input. 
**Per Cederberg** *[52:12]*: Ja. Jag tror att de är okej. 
**José Fernández Alameda** *[52:15]*: Vi tar. 
**Knut Sveidqvist** *[52:16]*: Itu med de nya svaren senare. Och Lindok, referensdokumentet vi behöver? 
**Per Cederberg** *[52:24]*: Det finns en fråga där. Jag tror att både dessa prox och Lindok, är inte det i princip bara samma sak? 
**Knut Sveidqvist** *[52:31]*: Bara hur du fångar dem? Jag säger att det är det. Ja. Och jag tror att kanske kan det gå. Prox från början var typ avsikten som länk så du kan klicka på det i redaktören och hamna i det andra dokumentet. Och. 
**Per Cederberg** *[52:49]*: Per hade den här tanken att kanske bara, jag menar, en snabb fix är att ha ge ett webbfetchverktyg och en URL och sedan laddar du upp dina dokument till varhelst du vill. En S3-förare eller något och sedan fetchas det där via ett verktyg. Så det är bara. 
**José Fernández Alameda** *[53:13]*: Ett verktygskall. 
**Knut Sveidqvist** *[53:16]*: Under huven, ja. Då kan. 
**Per Cederberg** *[53:19]*: Vi, men frågan är, vill visa att du har ett dokument här för användaren. 
**Knut Sveidqvist** *[53:24]*: Eller? Jag tror att det gör mycket skillnad. Eftersom de är ganska vitala för flödet och bra för att lyfta fram att här har du en full algoritmbeskrivning här som refereras av LLM. Ja. Okej, men jag tror att. 
**Per Cederberg** *[53:49]*: Båda två är samma. Lindhoek och Prox. 
**Knut Sveidqvist** *[53:52]*: Är... Låt oss hoppa över proxen, vi gör det ur skopet. Min förslag. Okej, så. 
**Ashish Jain** *[54:05]*: Vi behåller ett generöst alias. 
**Knut Sveidqvist** *[54:07]*: För detta också, liknande input. Ja, så vi kallar det referensdokument. Eller har vi något annat dokument? Kanske bara ett dokument? 
**José Fernández Alameda** *[54:30]*: Vi kallar. 
**Knut Sveidqvist** *[54:31]*: Det dokument eller vad? Eller referens? 
**Ashish Jain** *[54:36]*: Ja, vi kan kalla det referens eller Ref för kort, eller hur? För då kan det vara vilken referens som helst. Det kan vara en länk eller en fil eller. 
**Knut Sveidqvist** *[54:47]*: Okej. Suggestionen är röd. Låt oss använda den. Coolt och sedan har vi hexagon och jag tror att den kan gå. Ja. Skelett. Ja. Jag tror inte att det var tänkt att vara där ens. Jag tror att Claude blev inspirerad. Jag tror att vi kan använda. 
**Ashish Jain** *[55:05]*: Hexagonen för din MCP flow, din soft flow sak. Ja. ...Tittar form. Så jag säger inte att det är bara det faktiska elementet på grafen kan vara x-form. Så du. 
**Knut Sveidqvist** *[55:22]*: Har en visuellt annorlunda form. Bra där. Okej, så nu har vi också lagt till... Connector keyword. To the specific group, the connectors. Just now, we use a generic subgraph with magic properties, which is Jappgent 1. And this was the old removed shapes. Right now, we see they are still available, but we're solid. I think when we do 0.8. De borde generera syntax 0 om vi försöker använda en form som inte existerar. För vill se till att den minsta mängden synliga diagram som inte betyder något borde... Jag håller med. Kan jag. 
**Per Cederberg** *[56:19]*: Kommentera en sak till? En anslutare kontra verktyg. För mig The Connector provides. 
**Knut Sveidqvist** *[56:26]*: A set of tools. Yes. So when. 
**Per Cederberg** *[56:30]*: We provide stand alone. 
**Knut Sveidqvist** *[56:32]*: Tools, it's,. 
**Per Cederberg** *[56:34]*: I don't know, what do we mean by that? Do we mean that we have a set of standard tools that we provide? Yeah, so that is like,. 
**Ashish Jain** *[56:44]*: Yeah. That is like, yeah. The basis. 
**Knut Sveidqvist** *[56:44]*: Of the practice is so like the configuration for the connectors. 
**Per Cederberg** *[56:48]*: Jag tänker att vi kunde klargöra det genom att skippa verktygen och sedan bara ha anslutare och vi ger en massa standardanslutare. 
**Knut Sveidqvist** *[57:00]*: Skulle du inte duplicera konfigurationen i var och en? 
**Per Cederberg** *[57:07]*: Det är nästa del jag kommer till, jag tror, senare. Men jag har bara en tanke här, vi kan skippa det. 
**Knut Sveidqvist** *[57:14]*: För nu. Jag kan ta dig upp i hastighet till vad vi pratade om tidigare. Så på sätt och vis är verktygskallarna som kräver anslutningar. Är knutna till den anslutningen. Det var det jag pratade om tidigare. Med Atomics Create Nermichart diagram. Här, Mermit Chart, det är vår MCP-server. Craze Mermit Chart Diagram är ett av verktygen för den. Så här skulle du ha, i den cirkeln skulle du säga nummer ett. Och här skulle du säga nummer ett, kanske med någon färg. Så det skulle betyda att den här verktygslådan tillhör den kontakten. Du behöver inte lägga till alla projekt och token och allt det som du behöver. Du gör det bara på ett ställe. 
**Per Cederberg** *[58:12]*: Min poäng är att vi kan. 
**Ashish Jain** *[58:14]*: Ha. 
**Per Cederberg** *[58:14]*: En anslutare som är som fil... Filhandling, filhandling eller något som ger en massa verktyg och sedan kan du ha webbåtkomst. Det är en koppling, en slags generisk webb. 
**Knut Sveidqvist** *[58:29]*: Ja. Men jag tror att det fortfarande fungerar med det här konceptet. Och det gör det. Okej. Ja. Okej. Operatorer. Sequence. Vi förenklade det mycket. Jag tror att vi har... Vi har åtta innan. Nu har vi bara en sekvens och referens och förslaget från mig och Ashish efter att ha arbetat igår var att använda den prickade linjen för referenser, få dem att sticka ut lite mer från den vanliga sekvensen. 
**Ashish Jain** *[59:14]*: Det är bara för referensfogderna, eller hur? Det här är inte för. 
**Knut Sveidqvist** *[59:19]*: Ja. Och misslyckande. Så de här tre. 
**Per Cederberg** *[59:35]*: Ja. Och du får lägga till metadata på kanterna här där du kan skriva. 
**Knut Sveidqvist** *[59:40]*: Ytterligare instruktioner, eller hur? Kallelser, ja. 
**Per Cederberg** *[59:45]*: Som för beslut. Endast kallelser. För jag tänker att dina kallelser i listan vanligtvis kommer att säga ja, nej, men kanske i din faktiska prompt vill du säga något. Ja, om bla, bla, bla. Och du vill inte visa det. 
**Knut Sveidqvist** *[01:00:05]*: För det finns det. 
**Per Cederberg** *[01:00:08]*: Här i Mermaid, läste jag, att det finns. 
**Knut Sveidqvist** *[01:00:11]*: Stöd för metadata. Ja, så vi har det alternativet. Det kommer att vara lätt. Men vill du ha det på själva kanten? Ja, jag tänkte att det skulle. 
**Per Cederberg** *[01:00:24]*: Vara en möjlighet på själva kanten, men. 
**Knut Sveidqvist** *[01:00:27]*: Ja, så ... Tänk. 
**Per Cederberg** *[01:00:28]*: På denna prompt överallt. 
**Knut Sveidqvist** *[01:00:32]*: Okej, men det är bra. Då skulle det. 
**Ashish Jain** *[01:00:36]*: Vara... Jag tror att det skulle vara en linje på koden, men då har du en HID och vi har redan syntexen som liknar hur du definierar det på noten med en ATT-skylt. 
**Knut Sveidqvist** *[01:00:47]*: Ja. Det kommer att säljas om vill. Jag tror att jag tänker på det. Yes, I am. Here. Okej. Edge. One. Because then you need to set an ID on it. Yes. And then you have edge one. Well, this is... I buy it. You probably don't need it most of the time. But when you do, then you need it. Och här kanske vi bara tillåter prompt på det. Till att börja med. 
**Per Cederberg** *[01:01:28]*: Senare i dag ska jag dela min motförslag till hela. 
**Ashish Jain** *[01:01:33]*: Agent. 
**Knut Sveidqvist** *[01:01:33]*: Flow. För reflektion. 
**Per Cederberg** *[01:01:37]*: Eller inspiration. 
**Knut Sveidqvist** *[01:01:40]*: Ja, det är bra. Ja, så det här fungerar. Så låt oss tillåta det här också, men bara prompter. Eller, och vi kan alltid lägga till. Men det är baserat på erfarenhet nu. Det är bättre att lägga till som vi behöver än att ha mer från början. Behöver vi misslyckandet? 
**Per Cederberg** *[01:02:10]*: Ja,. 
**Knut Sveidqvist** *[01:02:11]*: Jag tror det. Jag försöker. 
**José Fernández Alameda** *[01:02:12]*: Ta bort det. Det är upp till oss att definiera vad misslyckande betyder i praktiken,. 
**Knut Sveidqvist** *[01:02:17]*: Antar jag. Eftersom. 
**José Fernández Alameda** *[01:02:18]*: Det kan vara många. 
**Knut Sveidqvist** *[01:02:19]*: Saker, men vad är modellen för det? Jag. 
**Ashish Jain** *[01:02:24]*: Tror att vi inte nödvändigtvis behöver misslyckad kurs, att hantera som med X. Det enda tänka, vilket kommer med det, är att på grafen, det skulle se ut som ett fint X som kan beteckna ett misslyckande, för om vi har egg-etiketten och om vi också godkänner promptet och nästa uppgift, då kan du ange att det här är som ett egg-fara scenario eller ett återhämtningsscenario. Så Syntex kräver inte detta, men jag tror bara för att det kommer att göra diagrammet lite du är uppe, att det här är en av kanterna, som är ett X, vilket betyder att du hanterar någon form av misslyckat scenario. Det är den enda möjligheten vi får, eller. 
**Per Cederberg** *[01:03:06]*: Hur? Jag kanske borde förtydliga, jag menar att det är absolut nödvändigt när du har ett beslut. Eftersom du tillhandahåller lite, det är inte alltid ja och nej. Ibland är det Du väljer. Är det en räkningskansli eller en... I grund och botten är det en annan. Kanske vill du modellera det som en annan. 
**Knut Sveidqvist** *[01:03:31]*: Då. Så ja. Kanske. 
**Per Cederberg** *[01:03:35]*: Är det inte strikt nödvändigt. 
**Knut Sveidqvist** *[01:03:38]*: Men syntaxmässigt har vi redan det. Om det gör ditt liv lättare nedströms. Jag ser inte heller, intuitivt sett, är det lätt att både förstå och komma ihåg med korset. 
**Per Cederberg** *[01:03:55]*: Så vi kan... I grund och botten, vad jag försöker göra är att när vi kommer till en beslutspunkt, kommer vi att tillhandahålla de märkta pilarna och vi kommer att tillhandahålla ett ytterligare okänt alternativ bakom kulisserna. Ja, okej. Och om det väljs, det är felet. 
**Knut Sveidqvist** *[01:04:13]*: Ja. Eller stopp. Ja. Men det är en öppen. 
**Per Cederberg** *[01:04:19]*: Fråga om du vill modellera det i kartan. 
**Knut Sveidqvist** *[01:04:22]*: Ja. Okej. Jag tror delat tillstånd som vi pratade om. Det kändes som. 
**José Fernández Alameda** *[01:04:35]*: Om jag blev galen igår med kommentarerna. 
**Knut Sveidqvist** *[01:04:37]*: Förlåt för det. Det. 
**José Fernández Alameda** *[01:04:40]*: Är bara jag på sidan. 
**Knut Sveidqvist** *[01:04:44]*: Ja, men det är bra. Men inställningar kan vi hoppa över nu med Pers idé. Stimplifiera. Ja. Ja, det är en lättnad. För den där. 
**Ashish Jain** *[01:05:02]*: Det var bara för subflödena, eller hur? Om du inte har ett alternativ för en uppgift eller något som upprepas. Så i det fallet, allt som är upprepat borde vara ett. 
**Knut Sveidqvist** *[01:05:16]*: Subflöde i det fallet, antar jag. Okej, har vi fall där vi behöver det? Passivere to rush. So here would we. 
**Ashish Jain** *[01:05:32]*: Want to have. You have the slack post and then you're using the slack post again in the second flow. So would you define prompts for it separately? 'Cause you want separate boxes. That was the. 
**Knut Sveidqvist** *[01:05:46]*: Whole case right? Yeah, so for this one. Ja. Skulle vilja ansluta... Skapa Mermit Chart-diagram till Mermit Chart via Instance of Connector? Vi måste ansluta denna verktygskalla som är en av verktygen som tillhandahålls av... Kontakten här. Vill vi göra det till en instans av kontakten? För då kan vi fortfarande använda. 
**Per Cederberg** *[01:06:27]*: Den. Jag menar, vokabulären är lite fel. Det kan inte vara en instans av kontakten, den använder. 
**Knut Sveidqvist** *[01:06:35]*: Kontakten. Bara... Ja. Så där, okej, använd. Vi kan använda det istället. 
**Per Cederberg** *[01:06:45]*: Men i andra LLM, använder man ett specifikt Connector-verktyg,. 
**Knut Sveidqvist** *[01:06:52]*: Då är det. 
**Per Cederberg** *[01:06:53]*: Som Connector.ToolName är standard. Ja. Men då är det ganska uppenbart. 
**Ashish Jain** *[01:07:08]*: Ja, vårt förbindelsebegrepp är bara förbindelsekonfigurationen för att fånga nyckeln och vad som krävs för att göra anslutningen och den faktiska uppkopplingen är till verktyget,. 
**Per Cederberg** *[01:07:21]*: Inte... Ja, men jag tänker att här borde det stå slack.replytothread och att slackdot innebär att det måste finnas en Slack-anslutare. 
**Knut Sveidqvist** *[01:07:32]*: Också. Det är i Connector F då förmodligen. Här är det... Ja, precis. Så det är svårt. 
**Ashish Jain** *[01:07:41]*: Att visa det i den faktiska grafen. 
**Knut Sveidqvist** *[01:07:47]*: Men då behöver vi en anslutare som heter Slack. Har vi det? Ja, så då kan vi faktiskt visualisera det från det. Vi arbetar lite i renderingen. Eftersom vi har datan här. Eller hur? Då behöver vi inte tillgång till det heller. Så låt oss försöka utan det. Och om vi behöver det, så lägger vi till användning av användare och sånt. Jag. 
**Per Cederberg** *[01:08:27]*: Tänkte faktiskt ett steg längre. Jag tänkte att där det bara i texten och identifieringen... Nej, det står postlänk och sedan står det, är det en beskrivning som kommer in där? I den? Ja. Jag tänkte att det i princip kan vara... Verktygets ID, i. 
**Knut Sveidqvist** *[01:08:47]*: Princip. Men du kanske. 
**Per Cederberg** *[01:08:49]*: Vill ha en beskrivning, jag vet inte. 
**José Fernández Alameda** *[01:08:52]*: Ja. Det är det som är. 
**Knut Sveidqvist** *[01:08:53]*: Visuellt. Och kanske, om du inte tillhandahåller det, då använder vi Connector F. 
**Per Cederberg** *[01:09:05]*: Jag trodde motsatsen, att Connector F inte existerar. Och du ger kontakten till Ref som beskrivningen för verktyget. 
**Knut Sveidqvist** *[01:09:14]*: Och då kan du beskriva i texten. 
**Per Cederberg** *[01:09:18]*: Att... Ja, du kan via promptattribut. 
**Knut Sveidqvist** *[01:09:22]*: Ja, du menar, du visar prompten. 
**Per Cederberg** *[01:09:27]*: Då döljer du instruktionen lite. Pros och. 
**Knut Sveidqvist** *[01:09:34]*: Cons är vanligt, men... Det var vad. 
**Per Cederberg** *[01:09:39]*: Jag trodde åtminstone, men nu förstår jag. 
**Knut Sveidqvist** *[01:09:41]*: Hur det skulle fungera. Ja, och de här går. Kräver och läser, antar jag. Och här har vi förmodligen en prompt. Det är en prompt som är Universal. Alla idéer och former kan ta ett prompt. Kan jag. 
**Per Cederberg** *[01:10:02]*: Få ett annat förslag direkt? Ja. Jag bytte från prompt till instruktion. 
**Knut Sveidqvist** *[01:10:09]*: På grund av min. 
**Per Cederberg** *[01:10:12]*: Egen personliga preferens,. 
**Knut Sveidqvist** *[01:10:14]*: Men bara för din övervikt. Jag har inte starka åsikter. Om... Jag har inget emot instruktioner. Det är lite långt kanske. 
**José Fernández Alameda** *[01:10:27]*: Jag har inget emot det heller. 
**Ashish Jain** *[01:10:28]*: Det. 
**José Fernández Alameda** *[01:10:28]*: Är bara vad folk hittar. 
**Knut Sveidqvist** *[01:10:32]*: Jag antar. 
**José Fernández Alameda** *[01:10:33]*: Att vi kommer att veta när vi börjar interagera med användare. 
**Knut Sveidqvist** *[01:10:42]*: Ja, så ska vi gå med instruktionen då? Låt oss bestämma. Ja. Det är bra för mig. Vi kallar det instruktion. Jag är inte säker på etiketten här. Jag tycker att det är trevligt att ha något. Ett litet område som är säkert. Det är ditt. Ja, för presentationen främst, men. Jag antar att LLM kommer att läsa det ändå. För att förstå. Men... Du hade Ref, det var formen. Ref. Och sedan pratade vi, det här är gammalt. Så det vi sa för 0 poäng, jag blandar versionerna tillsammans nu. De sa att alla referenser borde vara Ref. Så det kommer att finnas två olika Refs här. Ska vi ha. 
**José Fernández Alameda** *[01:11:50]*: Så. 
**Knut Sveidqvist** *[01:11:51]*: Kanske vi kallar det. Det här var för referensklockan. Så kanske vi gör Ref dock istället för. 
**Per Cederberg** *[01:11:57]*: Ref. Det här är ett verktyg, eller. 
**Knut Sveidqvist** *[01:11:59]*: Hur? Ja, jag sa precis Men det är fortfarande... Du kan fortfarande ha... Det kanske inte spelar någon roll, för det kommer inte att vara i samma form. Men det är fortfarande... Vi skär av det lite nära med semantisk överbelastning. Jag ser att José ser ut som att han tänker djupt. Ja. Så vi kan börja med Refref och vi kan se om vill göra något mer. Och ja. Okej. Det var verktyg och kontakter. Hives and metadata, only metadata. Cool. Metadata applicability, that one. 
**Per Cederberg** *[01:13:03]*: I think Swedish dokument. 
**Knut Sveidqvist** *[01:13:07]*: Thank you. I was just going through connectors, were done with those. Types and templates, we said metadata only last time. Metadata applicability, that one I think we dodge from this call. It's the chapter of its own. What goes into the flow, what goes here. Everything takes an instruction. I think maybe we read this. Av synk och se om det ser korrekt ut. Och sedan har vi ett nytt samtal imorgon kanske. Samtidigt, om jag kommer att komma med, eller sammanfatta det här uppdaterade snabbstartsdokumentet med matchande vad vi sa. Och vi kan granska det. Och om det inte finns något problematiskt, så kan vi Stänga av den och sedan kan vi börja implementera detta och byta. Ja. Perfekt. Bra grejer. Jag tror att du har rätt. Bra att ha dig med på samtalet Per. För då ankrar vi det i vad vi faktiskt behöver nedströms. 
**Knut Sveidqvist** *[01:14:24]*: Bra samtal från UFACI för att se till att Det hände, jag tänkte inte på det. Bara för att vi har. 
**José Fernández Alameda** *[01:14:30]*: Haft den här diskussionen parallellt och jag tyckte att det var bättre att bara ha allt här. Så vi kan ha alla vinklar. 
**Knut Sveidqvist** *[01:14:39]*: Ja. Så väldigt, väldigt produktiv. Tack så mycket. Så hur går vidare? Ja, jag ska göra en ny spekulation och skicka den till dig. Vi ska granska det och kanske vi kan titta på det. Men förmodligen imorgon. För jag tror att jag kommer att behöva lite assistans också för att ta reda på vad vi ska demografera. Ja. Det är läskigt. Jag kan säga nej, men jag vill inte säga nej på allt. Så det ser ut som att vi inte... Jag vet inte vad som har sagts. Så det är lite... Been thrown in the cold pont. But it's pretty important, but they feel that we are building this actively, which we are. Then they seem to think that we're further along and not as we can correct. We should not under any circumstances tell ountroofs. Och sanningen. Än en gång, vi behöver inte säga nej, nej. 
**Knut Sveidqvist** *[01:15:48]*: Vi måste visa lite goodwill också. Men jag menar, om det finns något. 
**José Fernández Alameda** *[01:15:54]*: Som jag skulle kunna applådera dig för hjälp med, använd dina steminos. 
**Knut Sveidqvist** *[01:16:04]*: Så kan vi springa. Så vad kan vi köra? Om de vill ha en live-demo? Jag menar, säg att vi inte kan demo exakt vad de vill. Vi kan förklara det med att vi faktiskt aktivt återfakturerar starttiden nu. För att vara mer produkt... För att bli redo för produktion och framåt. Men jag tyckte. 
**José Fernández Alameda** *[01:16:30]*: Att webbsidan var väldigt intressant, för den är väldigt visuell. Och du kan se vad de har producerat. Som Uppsalacoffeinet. De gör forskning och alla dessa steg och producerar något väldigt påtagligt och visuellt. Jag vet inte om det skulle vara bra. 
**Knut Sveidqvist** *[01:16:47]*: Jag tror att de hade sett det. Och vad de bad om, de behöver inte få det, är ett livexempel Att vi använder det inom Mermit aktivt. Vi har inte det. Jag säger att... Idealt, om jag kunde drömma, då skulle jag vilja ha demo... Listorna. Som fångar... Activity in the open source repo and mix this like post about it, etc. But I don't think we can wing that today. It's a big ask. 
**José Fernández Alameda** *[01:17:35]*: And what do you think. 
**Knut Sveidqvist** *[01:17:37]*: The reason is? Why they want it or why we can't do. 
**José Fernández Alameda** *[01:17:41]*: It? No, what do you think the reason is why we can't do it? 
**Knut Sveidqvist** *[01:17:47]*: Ja, jag gissar bara att det blir svårt för runtid att... Vi är mitt i mellanskillnaderna av syntaxer. Jag antar att vi kan använda 0,6-syntaxen. Men kan Claude agera, samla in sig för det här och köra det? Jag. 
**Per Cederberg** *[01:18:07]*: Vet inte. Har vi ens... Har vi. 
**Knut Sveidqvist** *[01:18:14]*: Flack Connector? Ja, det kanske vi har. Ja, så vad jag har gjort är att jag har... Fångat källkoden från... Repo. Skapat diagrammet och lagt det på Mermit Sharts hemsida med hjälp av... MCP-servern. Okej. Kumban, tack. Det flödet skulle fungera, tror jag. Men det är att få ihop allt här. 
**Per Cederberg** *[01:18:48]*: Jag vet att beslutspunkter i pakt, de utför båda. Det utför båda. Först den sanna, sedan den falska. 
**Knut Sveidqvist** *[01:19:01]*: Jag antar att vi kan förenkla det också, det är bra. Men Atomic Load Complic, vad gör det här? Jag vill dubbelklicka här och se i diagrammet vad det betyder. Här nu, du måste gå till kodredaktören. Ja. Och även få fönstret öppet med instruktionssatser och göra det lätt att gräva djupare. Så det här kan vara ett problem eftersom det här är ett skript. Då skulle vi ha en MCP-server någonstans som faktiskt kan köra de där GH-samtalen. Så kanske inte. Ja, så låt oss tänka på det. Jag tror att vi har varit i ett för mycket samtal. Något häftigt idag som vi kan göra utan att skriva någon ny kod. Det är något, tror jag. Så det är därför vi inte behöver vända oss inåt, men också visa lite bra... 
**Knut Sveidqvist** *[01:20:30]*: Vi vill visa oss när vi vet vad vi gör för jag tror att vi kommer att ha en produkt ganska snart. Men det är synd att de tror att vi är längre. Eller kanske provocerar de oss bara genom att ställa frågor som att vi är klara. 
**José Fernández Alameda** *[01:20:52]*: De vill förmodligen se var du är med största sannolikhet, men... Ja. Det kan påverka värderingen eller termerna. 
**Knut Sveidqvist** *[01:21:05]*: Ja, de var verkligen intresserade av agentflödet. Vad jag förstår var det som fick dem krokade. Ja, jag vet vad jag ska göra i alla fall. Men vi kanske kan spara 30 minuter på eftermiddagen. Så bara brainstorma. Ja. Det var bra. Låt oss äta lunch. Ha en bra dag. Ja. Hej då. 
