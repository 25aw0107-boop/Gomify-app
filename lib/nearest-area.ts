export type AreaRecord = {
  area_id: number;
  area_name_jp: string;
  ward_id?: number | null;
};

const WARD_MAP: Record<number, string> = {
  1: '新宿区',
  2: '北区',
  3: '板橋区',
  4: '練馬区',
  5: '台東区',
  6: '墨田区',
  7: '江東区',
  8: '荒川区',
  9: '足立区',
  10: '葛飾区',
  11: '渋谷区',
  12: '港区',
  13: '中央区',
  14: '千代田区',
  15: '品川区',
  16: '目黒区',
  17: '大田区',
  18: '世田谷区',
  19: '中野区',
  20: '杉並区',
  21: '豊島区',
  22: '文京区',
  23: '江戸川区',
};

const normalizeText = (value: string) =>
  value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s\u3000]/g, '')
    .replace(/[・,./\\()（）\[\]【】\-–—_]/g, '')
    .trim();

const levenshteinDistance = (left: string, right: string) => {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;

  const previousRow = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let row = 1; row <= left.length; row += 1) {
    const currentRow = [row];

    for (let column = 1; column <= right.length; column += 1) {
      const insertionCost = currentRow[column - 1] + 1;
      const deletionCost = previousRow[column] + 1;
      const substitutionCost = previousRow[column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1);
      currentRow.push(Math.min(insertionCost, deletionCost, substitutionCost));
    }

    for (let column = 0; column < previousRow.length; column += 1) {
      previousRow[column] = currentRow[column];
    }
  }

  return previousRow[right.length];
};

const similarityScore = (left: string, right: string) => {
  if (!left || !right) return 0;
  const maxLength = Math.max(left.length, right.length);
  if (!maxLength) return 0;
  return 1 - levenshteinDistance(left, right) / maxLength;
};

export const getWardName = (wardId?: number | null) => {
  if (!wardId) return '';
  return WARD_MAP[wardId] || '';
};

export const formatAreaLabel = (area: AreaRecord) => {
  const wardName = getWardName(area.ward_id);
  if (wardName && !area.area_name_jp.includes(wardName)) {
    return `${wardName} ${area.area_name_jp}`;
  }

  return area.area_name_jp;
};

export const buildLocationHintText = (parts: Array<string | null | undefined>) =>
  parts.filter((part): part is string => Boolean(part && part.trim())).join(' ');

export const findBestAreaMatch = (sources: Array<string | null | undefined>, areas: AreaRecord[]) => {
  const normalizedSources = sources.map((source) => normalizeText(source || '')).filter(Boolean);
  let bestArea: AreaRecord | null = null;
  let bestScore = 0;

  for (const area of areas) {
    const areaLabel = formatAreaLabel(area);
    const normalizedAreaLabel = normalizeText(areaLabel);
    const normalizedAreaName = normalizeText(area.area_name_jp);
    const normalizedWardName = normalizeText(getWardName(area.ward_id));

    let score = 0;

    for (const source of normalizedSources) {
      if (!source) continue;

      if (source === normalizedAreaLabel || source === normalizedAreaName) {
        score = Math.max(score, 120);
      }

      if (source.includes(normalizedAreaLabel) || normalizedAreaLabel.includes(source)) {
        score = Math.max(score, 110);
      }

      if (source.includes(normalizedAreaName) || normalizedAreaName.includes(source)) {
        score = Math.max(score, 100);
      }

      if (normalizedWardName && (source.includes(normalizedWardName) || normalizedWardName.includes(source))) {
        score = Math.max(score, 90);
      }

      score = Math.max(score, Math.round(similarityScore(source, normalizedAreaLabel) * 75));
      score = Math.max(score, Math.round(similarityScore(source, normalizedAreaName) * 70));
    }

    if (score > bestScore) {
      bestScore = score;
      bestArea = area;
    }
  }

  return { area: bestArea, score: bestScore };
};