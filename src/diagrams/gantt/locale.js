import ar_EG from 'd3-time-format/locale/ar-EG.json';
import ca_ES from 'd3-time-format/locale/ca-ES.json';
import cs_CZ from 'd3-time-format/locale/cs-CZ.json';
import da_DK from 'd3-time-format/locale/da-DK.json';
import de_CH from 'd3-time-format/locale/de-CH.json';
import de_DE from 'd3-time-format/locale/de-DE.json';
import en_CA from 'd3-time-format/locale/en-CA.json';
import en_GB from 'd3-time-format/locale/en-GB.json';
import en_US from 'd3-time-format/locale/en-US.json';
import es_ES from 'd3-time-format/locale/es-ES.json';
import es_MX from 'd3-time-format/locale/es-MX.json';
import fa_IR from 'd3-time-format/locale/fa-IR.json';
import fi_FI from 'd3-time-format/locale/fi-FI.json';
import fr_CA from 'd3-time-format/locale/fr-CA.json';
import fr_FR from 'd3-time-format/locale/fr-FR.json';
import he_IL from 'd3-time-format/locale/he-IL.json';
import hu_HU from 'd3-time-format/locale/hu-HU.json';
import it_IT from 'd3-time-format/locale/it-IT.json';
import ja_JP from 'd3-time-format/locale/ja-JP.json';
import ko_KR from 'd3-time-format/locale/ko-KR.json';
import mk_MK from 'd3-time-format/locale/mk-MK.json';
import nb_NO from 'd3-time-format/locale/nb-NO.json';
import nl_NL from 'd3-time-format/locale/nl-NL.json';
import pl_PL from 'd3-time-format/locale/pl-PL.json';
import pt_BR from 'd3-time-format/locale/pt-BR.json';
import ru_RU from 'd3-time-format/locale/ru-RU.json';
import sv_SE from 'd3-time-format/locale/sv-SE.json';
import tr_TR from 'd3-time-format/locale/tr-TR.json';
import uk_UA from 'd3-time-format/locale/uk-UA.json';
import zh_CN from 'd3-time-format/locale/zh-CN.json';
import zh_TW from 'd3-time-format/locale/zh-TW.json';

const locales = {
  'ar-EG': ar_EG,
  'ca-ES': ca_ES,
  'cs-CZ': cs_CZ,
  'da-DK': da_DK,
  'de-CH': de_CH,
  'de-DE': de_DE,
  'en-CA': en_CA,
  'en-GB': en_GB,
  'en-US': en_US,
  'es-ES': es_ES,
  'es-MX': es_MX,
  'fa-IR': fa_IR,
  'fi-FI': fi_FI,
  'fr-CA': fr_CA,
  'fr-FR': fr_FR,
  'he-IL': he_IL,
  'hu-HU': hu_HU,
  'it-IT': it_IT,
  'ja-JP': ja_JP,
  'ko-KR': ko_KR,
  'mk-MK': mk_MK,
  'nb-NO': nb_NO,
  'nl-NL': nl_NL,
  'pl-PL': pl_PL,
  'pt-BR': pt_BR,
  'ru-RU': ru_RU,
  'sv-SE': sv_SE,
  'tr-TR': tr_TR,
  'uk-UA': uk_UA,
  'zh-CN': zh_CN,
  'zh-TW': zh_TW,
};

export default function (lang) {
  return locales[lang] || locales['en-US'];
}
