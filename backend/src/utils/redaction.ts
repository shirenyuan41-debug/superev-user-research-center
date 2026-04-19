type RedactionRule = 'mobile' | 'idCard' | 'email' | 'address';

type RedactionResult = {
  rules: RedactionRule[];
  text: string;
};

const mobilePattern = /(?<!\d)(1[3-9]\d)(?:[-\s]?\d{4})([-\s]?\d{4})(?!\d)/g;
const idCard18Pattern = /(?<![A-Za-z0-9])(\d{6})\d{8}([0-9Xx]{4})(?![A-Za-z0-9])/g;
const idCard15Pattern = /(?<![A-Za-z0-9])(\d{6})\d{5}(\d{4})(?![A-Za-z0-9])/g;
const emailPattern = /\b([A-Za-z0-9._%+-]{1,3})[A-Za-z0-9._%+-]*(@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/g;
const addressPattern = /((?:中国)?(?:[\u4e00-\u9fa5]{2,}(?:省|自治区|特别行政区))?(?:[\u4e00-\u9fa5]{2,}(?:市|州|盟))?(?:[\u4e00-\u9fa5]{2,}(?:区|县|旗))?)([\u4e00-\u9fa5A-Za-z0-9#\-]{2,}(?:路|街|巷|道|村|小区|苑|弄|号楼|号|栋|单元|室|层|座)[\u4e00-\u9fa5A-Za-z0-9#\-]*)/g;

const maskAddressDetail = (detail: string) => {
  const trimmed = detail.trim();
  if (!trimmed) {
    return detail;
  }

  const keptPrefixLength = Math.min(6, Math.max(2, Math.floor(trimmed.length / 3)));
  return `${trimmed.slice(0, keptPrefixLength)}***`;
};

export const redactSensitiveText = (input: string): RedactionResult => {
  const appliedRules = new Set<RedactionRule>();

  let text = input;

  text = text.replace(mobilePattern, (_match, prefix: string, suffix: string) => {
    appliedRules.add('mobile');
    return `${prefix}****${suffix}`;
  });

  text = text.replace(idCard18Pattern, (_match, prefix: string, suffix: string) => {
    appliedRules.add('idCard');
    return `${prefix}********${suffix}`;
  });

  text = text.replace(idCard15Pattern, (_match, prefix: string, suffix: string) => {
    appliedRules.add('idCard');
    return `${prefix}*****${suffix}`;
  });

  text = text.replace(emailPattern, (_match, prefix: string, suffix: string) => {
    appliedRules.add('email');
    return `${prefix}***${suffix}`;
  });

  text = text.replace(addressPattern, (_match, region: string, detail: string) => {
    if (!region && !detail) {
      return _match;
    }

    appliedRules.add('address');
    return `${region}${maskAddressDetail(detail)}`;
  });

  return {
    rules: Array.from(appliedRules),
    text,
  };
};
