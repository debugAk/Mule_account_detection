export interface ThemeColors {
  bg: string;
  text: string;
  textMuted: string;
  accountBorder: string;
  accountBg: string;
  criticalBorder: string;
  criticalBg: string;
  warnBorder: string;
  warnBg: string;
  beneficiaryBorder: string;
  beneficiaryBg: string;
  deviceBorder: string;
  deviceBg: string;
  phoneBorder: string;
  phoneBg: string;
  edge: string;
  edgeArrow: string;
  edgeHover: string;
  edgeHop: string;
  edgeLabelBg: string;
  edgeLabelText: string;
}

export const getThemePalette = (theme: 'daylight' | 'night'): ThemeColors => {
  if (theme === 'night') {
    return {
      bg: '#14161A',
      text: '#E8E4DC',
      textMuted: '#9A958B',
      accountBorder: '#5FB8A8',
      accountBg: '#132E2B',
      criticalBorder: '#F25C54',
      criticalBg: '#3E1818',
      warnBorder: '#E0A458',
      warnBg: '#382613',
      beneficiaryBorder: '#D175B7',
      beneficiaryBg: '#321435',
      deviceBorder: '#6895D2',
      deviceBg: '#162235',
      phoneBorder: '#F3C623',
      phoneBg: '#332912',
      edge: '#2E3542',
      edgeArrow: '#4A5568',
      edgeHover: '#5FB8A8',
      edgeHop: '#F25C54',
      edgeLabelBg: '#1E232B',
      edgeLabelText: '#F3F4F6',
    };
  }
  return {
    bg: '#FAF8F4',
    text: '#1C1B19',
    textMuted: '#6B6862',
    accountBorder: '#14524B',
    accountBg: '#E6F4F1',
    criticalBorder: '#A32A2A',
    criticalBg: '#FDE8E8',
    warnBorder: '#B4690E',
    warnBg: '#FEF3E2',
    beneficiaryBorder: '#8E24AA',
    beneficiaryBg: '#F5E6F7',
    deviceBorder: '#1976D2',
    deviceBg: '#E8F0FE',
    phoneBorder: '#E65100',
    phoneBg: '#FFF8E1',
    edge: '#CBD5E1',
    edgeArrow: '#94A3B8',
    edgeHover: '#14524B',
    edgeHop: '#A32A2A',
    edgeLabelBg: '#FFFFFF',
    edgeLabelText: '#1E293B',
  };
};
