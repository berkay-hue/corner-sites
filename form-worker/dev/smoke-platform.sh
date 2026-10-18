#!/bin/bash
# brandcorner platform API'si için yerel duman testi. Yalnızca wrangler dev'e karşı çalıştırın
# (komutları form-worker/ klasöründen çalıştırın):
#   wrangler d1 execute corner-forms --local --file=schema.sql
#   wrangler d1 migrations apply corner-forms --local   (0001–0003; metrik ve OAuth tabloları)
#   node dev/fake-smtp.mjs 2525 /tmp/mails > /tmp/smtp.log &
#   wrangler dev --local --port 8799 --var DEV_ORIGINS:http://localhost:8788 \
#     --var SMTP_HOST:127.0.0.1 --var SMTP_PORT:2525 --var SMTP_TLS:off --var SMTP_PASS:dev > /tmp/wd.log 2>&1
#   MAIL_LOG=/tmp/smtp.log bash dev/smoke-platform.sh [http://localhost:8799]
# MAIL_LOG sahte SMTP sunucusunun çıktısı; verilmezse şifre sıfırlama adımları atlanır. Hız sınırları saatlik:
# aynı yerel D1'de saatte birden çok çalıştırmak 429 verir (her seferinde --persist-to ile boş bir klasör kullanın).
# Test hesapları her çalıştırmada rastgele e-posta ve şifreyle yerel D1'e açılır; şifre ekrana yazılmaz.
set -u
API=${1:-http://localhost:8799}
case "$API" in http://localhost:*|http://127.0.0.1:*) ;; *) echo "yalnızca localhost"; exit 2 ;; esac
O=http://localhost:8788
RUN=$(openssl rand -hex 4)
PASS=$(openssl rand -base64 18)
fail=0

call() { # call METHOD PATH TOKEN BODY → stdout: "<status> <json>"
  local args=(-s -w "\n%{http_code}" -X "$1" -H "Origin: $O" -H "content-type: application/json")
  [ -n "$3" ] && args+=(-H "Authorization: Bearer $3")
  [ -n "${4:-}" ] && args+=(--data "$4")
  local out; out=$(curl "${args[@]}" "$API$2")
  echo "${out##*$'\n'} ${out%$'\n'*}"
}
check() { # check AD BEKLENEN_KOD "<status> <json>"
  local got=${3%% *}
  if [ "$got" = "$2" ]; then echo "ok   $1 ($got)"; else echo "HATA $1: $2 beklendi, $3"; fail=1; fi
}
body() { echo "${1#* }"; }
reg() { jq -nc --arg n "$1" --arg e "$2" --arg p "$PASS" --arg r "$3" '{name:$n,email:$e,password:$p,role:$r,lang:"tr",consent:true,hp:"",t:4000}'; }
# reg'in gövdesini değiştirir: regx '<jq ifadesi>' AD E-POSTA ROL
regx() { reg "$2" "$3" "$4" | jq -c "$1"; }

r=$(call POST /auth/register "" "$(reg 'Test Marka' "marka-$RUN@example.test" brand)"); check "marka kaydı" 200 "$r"
BT=$(body "$r" | jq -r .token)
r=$(call POST /auth/register "" "$(regx 'del(.consent)' 'Onaysız' "onaysiz-$RUN@example.test" brand)"); check "onaysız kayıt" 400 "$r"
[ "$(body "$r" | jq -r .error)" = consent ] || { echo "HATA onaysız kayıt kodu: $r"; fail=1; }
r=$(call POST /auth/register "" "$(regx '.consent="true"' 'Onaysız' "onaysiz-$RUN@example.test" brand)"); check "onay true değil" 400 "$r"
r=$(call POST /auth/register "" "$(regx '.hp="http://spam.test"' 'Bot' "bot-$RUN@example.test" brand)"); check "dolu gizli alan" 400 "$r"
r=$(call POST /auth/register "" "$(regx '.t=300' 'Bot' "bot-$RUN@example.test" brand)"); check "çok hızlı gönderim" 400 "$r"
r=$(call POST /auth/register "" "$(regx 'del(.t)' 'Bot' "bot-$RUN@example.test" brand)"); check "süresiz gönderim" 400 "$r"
[ "$(body "$r" | jq -r .error)" = bad ] || { echo "HATA bot kodu genel değil: $r"; fail=1; }
r=$(call POST /auth/login "" "$(jq -nc --arg e "bot-$RUN@example.test" --arg p "$PASS" '{email:$e,password:$p}')"); check "bot hesabı açılmadı" 401 "$r"
r=$(call POST /auth/register "" "$(reg 'Test Influencer' "inf-$RUN@example.test" influencer)"); check "influencer kaydı" 200 "$r"
IT=$(body "$r" | jq -r .token); IID=$(body "$r" | jq -r .user.id)
r=$(call POST /auth/register "" "$(reg 'Tekrar' "marka-$RUN@example.test" brand)"); check "aynı e-posta" 409 "$r"
r=$(call POST /auth/login "" "$(jq -nc --arg e "marka-$RUN@example.test" '{email:$e,password:"yanlis-sifre"}')"); check "yanlış şifre" 401 "$r"
r=$(call POST /auth/login "" "$(jq -nc --arg e "MARKA-$RUN@example.test" --arg p "$PASS" '{email:$e,password:$p}')"); check "giriş" 200 "$r"
BT=$(body "$r" | jq -r .token)
r=$(call GET /auth/me "$BT"); check "me" 200 "$r"
r=$(call GET /auth/me ""); check "token'sız me" 401 "$r"

r=$(call POST /app/profile "$IT" '{"profile":{"bio":"Yemek ve seyahat","niches":["Yemek","Seyahat"],"platforms":[{"platform":"instagram","handle":"@test","followers":12000},{"platform":"myspace"}],"listed":true}}')
check "influencer profili" 200 "$r"
[ "$(body "$r" | jq '.user.profile.platforms | length')" = 1 ] || { echo "HATA geçersiz platform elenmedi"; fail=1; }
r=$(call GET /app/influencers?niche=yemek "$BT"); check "influencer listesi" 200 "$r"
[ "$(body "$r" | jq '.influencers | length')" -ge 1 ] && [ "$(body "$r" | jq '[.influencers[] | has("email")] | any')" = false ] || { echo "HATA listede e-posta ya da kayıt yok"; fail=1; }
r=$(call GET /app/influencers "$IT"); check "influencer listeyi göremez" 403 "$r"

r=$(call POST /app/campaigns "$BT" '{"title":"Kış menüsü","brief":"3 reels","niches":["yemek"],"platforms":["instagram","tiktok"],"budget_min":5000,"budget_max":15000,"currency":"TRY","deadline":"2026-12-01"}')
check "kampanya aç" 200 "$r"; CID=$(body "$r" | jq -r .campaign.id)
r=$(call POST /app/campaigns "$IT" '{"title":"x"}'); check "influencer kampanya açamaz" 403 "$r"
r=$(call GET /app/campaigns "$IT"); check "açık kampanyalar" 200 "$r"
[ "$(body "$r" | jq ".campaigns[] | select(.id == $CID) | .match")" = 80 ] || { echo "HATA uyum skoru 80 değil: $(body "$r" | jq -c '.campaigns[0]')"; fail=1; }
r=$(call POST /app/campaigns/$CID/apply "$IT" '{"message":"Merhaba"}'); check "başvuru" 200 "$r"; AID=$(body "$r" | jq -r .application.id)
r=$(call POST /app/campaigns/$CID/apply "$IT" '{}'); check "ikinci başvuru" 409 "$r"
r=$(call POST /app/applications/$AID "$IT" '{"status":"accepted"}'); check "influencer kendini kabul edemez" 400 "$r"
r=$(call POST /app/applications/$AID "$BT" '{"status":"accepted"}'); check "marka kabul" 200 "$r"
r=$(call POST /app/applications/$AID "$IT" '{"status":"submitted","content_url":"javascript:alert(1)"}'); check "kötü içerik linki" 400 "$r"
r=$(call POST /app/applications/$AID "$IT" '{"status":"submitted","content_url":"https://instagram.com/p/abc"}'); check "içerik gönder" 200 "$r"
r=$(call POST /app/applications/$AID "$BT" '{"status":"revision","note":"Logoyu ilk saniyede göster"}'); check "revizyon iste" 200 "$r"
[ "$(body "$r" | jq -r .application.revision_note)" = "Logoyu ilk saniyede göster" ] || { echo "HATA revizyon notu"; fail=1; }
r=$(call POST /app/applications/$AID "$IT" '{"status":"submitted","content_url":"https://instagram.com/p/abc2"}'); check "yeniden gönder" 200 "$r"
r=$(call POST /app/applications/$AID "$BT" '{"status":"approved"}'); check "içerik onay" 200 "$r"
r=$(call GET /app/campaigns/$CID "$BT"); check "kampanya detayı (marka)" 200 "$r"
[ "$(body "$r" | jq -r '.applications[0].status')" = approved ] || { echo "HATA başvuru durumu"; fail=1; }
r=$(call POST /app/campaigns/$CID/invite "$BT" "{\"user_id\":$IID}"); check "aynı kişiye davet" 409 "$r"
r=$(call POST /auth/register "" "$(reg "Test Ajans" "ajans-$RUN@example.test" agency)"); check "ajans kaydı" 200 "$r"
AT=$(body "$r" | jq -r .token)
r=$(call POST /auth/register "" "$(reg "Test Influencer 2" "inf2-$RUN@example.test" influencer)"); check "ikinci influencer" 200 "$r"
I2T=$(body "$r" | jq -r .token); I2ID=$(body "$r" | jq -r .user.id)
r=$(call POST /app/profile "$I2T" '{"profile":{"niches":["Yemek"],"listed":true}}'); check "ikinci profil (davet için listelenir)" 200 "$r"
r=$(call POST /app/campaigns/$CID/invite "$BT" "{\"user_id\":$I2ID,\"message\":\"Davet\"}"); check "davet" 200 "$r"; DID=$(body "$r" | jq -r .application.id)
r=$(call GET /app/influencers "$BT"); check "geçmişli liste" 200 "$r"
[ "$(body "$r" | jq -r ".influencers[] | select(.id == $I2ID) | .history[0].status")" = invited ] || { echo "HATA davet geçmişte yok"; fail=1; }
# Başka markanın listesinde bu davet görünmemeli
r=$(call GET /app/influencers "$AT"); check "başka marka listesi" 200 "$r"
[ "$(body "$r" | jq -c ".influencers[] | select(.id == $I2ID) | .history")" = "[]" ] || { echo "HATA geçmiş başka markaya sızıyor: $r"; fail=1; }
r=$(call POST /app/applications/$DID "$I2T" '{"status":"accepted"}'); check "daveti kabul" 200 "$r"
r=$(call GET /app/stats "$BT"); check "istatistik" 200 "$r"
r=$(call GET /app/applications "$IT"); check "başvurularım" 200 "$r"
r=$(call POST /app/campaigns/$CID "$BT" '{"status":"closed"}'); check "kampanya kapat" 200 "$r"
r=$(call POST /auth/logout "$BT"); check "çıkış" 200 "$r"
r=$(call GET /auth/me "$BT"); check "çıkıştan sonra me" 401 "$r"
r=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Origin: https://saascorner.co' -H 'content-type: application/json' --data '{}' "$API/auth/login"); check "başka site" 403 "$r"

r=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS -H "Origin: $O" -H "Access-Control-Request-Headers: authorization" -D - "$API/app/stats" | tr -d "\r" | grep -ci "^access-control-allow-headers:.*authorization"); check "preflight authorization" 1 "$r"
r=$(call POST /submit "" '{"page":"/smoke","fields":[["Ad","Duman testi"]]}'); check "eski form /submit" 200 "$r"

# Şifre sıfırlama: dev/fake-smtp.mjs her e-postayı çözüp geçici dosyaya yazar, yolunu loga basar ("Text: <yol>")
if [ -z "${MAIL_LOG:-}" ]; then
  echo "atlandı şifre sıfırlama (MAIL_LOG verilmedi)"
else
  mail_files() { perl -ne 'print "$1\n" if m{Text: (/\S+)}' "$MAIL_LOG"; }
  mails() { mail_files | wc -l | tr -d ' '; }
  # mail_token N → N. e-postadan sonra gelen ilk e-postadaki ilk linkin token'ı (en çok 5 sn beklenir); gelmezse boş
  mail_token() {
    local i f
    for i in 1 2 3 4 5 6 7 8 9 10; do [ "$(mails)" -gt "$1" ] && break; sleep 0.5; done
    f=$(mail_files | sed -n "$(($1 + 1))p")
    [ -n "$f" ] && perl -ne 'if (m{#t=([A-Za-z0-9_-]{43})}) { print $1; exit }' "$f"
  }
  forgot() { jq -nc --arg e "$1" --arg l "$2" '{email:$e,lang:$l}'; }
  reset_body() { jq -nc --arg t "$1" --arg p "$2" '{token:$t,password:$p}'; }
  login() { jq -nc --arg e "$1" --arg p "$2" '{email:$e,password:$p}'; }
  NEWPASS=$(openssl rand -base64 18)

  n=$(mails); r=$(call POST /auth/forgot "" "$(forgot "inf-$RUN@example.test" tr)"); check "şifremi unuttum" 200 "$r"
  T1=$(mail_token "$n"); [ -n "$T1" ] || { echo "HATA sıfırlama e-postası yok"; fail=1; }
  grep -q "/sifre-yenile#t=$T1" "$(mail_files | tail -1)" || { echo "HATA Türkçe link /sifre-yenile değil"; fail=1; }
  n=$(mails); r=$(call POST /auth/forgot "" "$(forgot "yok-$RUN@example.test" tr)"); check "kayıtsız adres aynı yanıt" 200 "$r"
  sleep 1; [ "$(mails)" = "$n" ] || { echo "HATA kayıtsız adrese e-posta gitti"; fail=1; }
  r=$(call POST /auth/forgot "" '{"email":"bozuk"}'); check "geçersiz e-posta" 400 "$r"
  n=$(mails); r=$(call POST /auth/forgot "" "$(forgot "inf-$RUN@example.test" en)"); check "ikinci istek" 200 "$r"
  T2=$(mail_token "$n"); [ -n "$T2" ] && [ "$T2" != "$T1" ] || { echo "HATA ikinci token yok ya da aynı"; fail=1; }
  grep -q "/reset-password#t=$T2" "$(mail_files | tail -1)" || { echo "HATA İngilizce link /reset-password değil"; fail=1; }
  r=$(call POST /auth/reset "" "$(reset_body kisa "$NEWPASS")"); check "bozuk token" 400 "$r"
  [ "$(body "$r" | jq -r .error)" = reset_invalid ] || { echo "HATA bozuk token kodu: $r"; fail=1; }
  r=$(call POST /auth/reset "" "$(reset_body "$T2" kisa)"); check "kısa yeni şifre" 400 "$r"
  r=$(call POST /auth/reset "" "$(reset_body "$T1" "$NEWPASS")"); check "eski link geçersiz" 400 "$r"
  r=$(call POST /auth/reset "" "$(reset_body "$T2" "$NEWPASS")"); check "şifre sıfırla (kısa şifre linki harcamadı)" 200 "$r"
  RT=$(body "$r" | jq -r .token)
  r=$(call GET /auth/me "$RT"); check "sıfırlamadan sonra me" 200 "$r"
  r=$(call GET /auth/me "$IT"); check "eski oturum kapandı" 401 "$r"
  r=$(call POST /auth/reset "" "$(reset_body "$T2" "$NEWPASS")"); check "link tek kullanımlık" 400 "$r"
  r=$(call POST /auth/login "" "$(login "inf-$RUN@example.test" "$PASS")"); check "eski şifreyle giriş" 401 "$r"
  r=$(call POST /auth/login "" "$(login "inf-$RUN@example.test" "$NEWPASS")"); check "yeni şifreyle giriş" 200 "$r"
fi
[ $fail = 0 ] && echo "SONUÇ: hepsi geçti" || { echo "SONUÇ: HATA var"; exit 1; }
