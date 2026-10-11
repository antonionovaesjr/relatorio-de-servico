import { describe, it, expect } from 'vitest';
import {
  calculateRemainingMonthlyTime,
  parseTimeToMinutesFlexible,
} from './date';

describe('Cálculo Matemático de Horas Mensais Faltantes (calculateRemainingMonthlyTime)', () => {
  it('deve calcular corretamente 43h45 cumpridas de 50h resultando em 6h15 faltantes', () => {
    // 50h = 3000 minutos; 43h45 = 2625 minutos; Faltam: 375 minutos = 6h15 / 6:15
    const resultStringH = calculateRemainingMonthlyTime(50, '43h45');
    expect(resultStringH.targetMinutes).toBe(3000);
    expect(resultStringH.completedMinutes).toBe(2625);
    expect(resultStringH.remainingMinutes).toBe(375);
    expect(resultStringH.formattedRemaining).toBe('6:15');
    expect(resultStringH.formattedRemainingHours).toBe('6h15');
    expect(resultStringH.isTargetReached).toBe(false);
    expect(resultStringH.progressPercent).toBe(88);

    // Também no formato HH:MM padrão "43:45"
    const resultHHMM = calculateRemainingMonthlyTime(50, '43:45');
    expect(resultHHMM.remainingMinutes).toBe(375);
    expect(resultHHMM.formattedRemaining).toBe('6:15');
    expect(resultHHMM.formattedRemainingHours).toBe('6h15');

    // Também com minutos numéricos (2625)
    const resultMinutes = calculateRemainingMonthlyTime(50, 2625);
    expect(resultMinutes.remainingMinutes).toBe(375);
    expect(resultMinutes.formattedRemaining).toBe('6:15');
  });

  it('deve calcular 40:00 cumpridas de 50h resultando exatamente em 10:00 faltantes', () => {
    const result = calculateRemainingMonthlyTime(50, '40:00');
    expect(result.targetMinutes).toBe(3000);
    expect(result.completedMinutes).toBe(2400);
    expect(result.remainingMinutes).toBe(600);
    expect(result.formattedRemaining).toBe('10:00');
    expect(result.formattedRemainingHours).toBe('10h');
    expect(result.isTargetReached).toBe(false);
    expect(result.progressPercent).toBe(80);
  });

  it('não deve retornar valores negativos quando a meta for superada', () => {
    // 55h cumpridas de meta de 50h
    const resultOver = calculateRemainingMonthlyTime(50, '55:00');
    expect(resultOver.remainingMinutes).toBe(0);
    expect(resultOver.remainingMinutes).toBeGreaterThanOrEqual(0);
    expect(resultOver.formattedRemaining).toBe('0:00');
    expect(resultOver.isTargetReached).toBe(true);
    expect(resultOver.progressPercent).toBe(100);

    // 50h cumpridas exatas
    const resultExact = calculateRemainingMonthlyTime(50, '50:00');
    expect(resultExact.remainingMinutes).toBe(0);
    expect(resultExact.formattedRemaining).toBe('0:00');
    expect(resultExact.isTargetReached).toBe(true);
    expect(resultExact.progressPercent).toBe(100);
  });

  it('deve lidar com meta do pioneiro auxiliar (30h ou 15h)', () => {
    // 14h15 de 15h
    const result15 = calculateRemainingMonthlyTime(15, '14h15');
    expect(result15.targetMinutes).toBe(900);
    expect(result15.completedMinutes).toBe(855);
    expect(result15.remainingMinutes).toBe(45);
    expect(result15.formattedRemaining).toBe('0:45');
    expect(result15.isTargetReached).toBe(false);

    // 25h de 30h
    const result30 = calculateRemainingMonthlyTime(30, 25 * 60);
    expect(result30.remainingMinutes).toBe(300);
    expect(result30.formattedRemaining).toBe('5:00');
  });

  it('deve fazer parse flexível de formatos variados de texto em parseTimeToMinutesFlexible', () => {
    expect(parseTimeToMinutesFlexible('43h45')).toBe(2625);
    expect(parseTimeToMinutesFlexible('43H45')).toBe(2625);
    expect(parseTimeToMinutesFlexible('43h 45m')).toBe(2625);
    expect(parseTimeToMinutesFlexible('43h')).toBe(2580);
    expect(parseTimeToMinutesFlexible('43:45')).toBe(2625);
    expect(parseTimeToMinutesFlexible(120)).toBe(120);
    expect(parseTimeToMinutesFlexible('')).toBe(0);
  });
});
