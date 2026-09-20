/**
 * Utilitários para captura de geolocalização por GPS e geocodificação reversa
 */

export interface GeolocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface ReverseGeocodeResult {
  address: string;
  number?: string;
  city?: string;
  latitude: number;
  longitude: number;
}

/**
 * Obtém as coordenadas GPS atuais usando a Geolocation API do navegador
 */
export function getCurrentCoordinates(options?: PositionOptions): Promise<GeolocationCoords> {
  return new Promise((resolve, reject) => {
    // 1. Verifica se a origem é segura (HTTPS ou localhost)
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      const err = new Error('INSECURE_CONTEXT');
      (err as unknown as { code: number }).code = 1001;
      reject(err);
      return;
    }

    // 2. Verifica suporte da API
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      const err = new Error('GEOLOCATION_NOT_SUPPORTED');
      (err as unknown as { code: number }).code = 1002;
      reject(err);
      return;
    }

    // 3. Tenta obter coordenadas com alta precisão
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        // Se falhar por timeout (3) ou posição indisponível (2), tenta uma vez sem alta precisão (Wi-Fi/torre celular)
        if (error.code === 2 || error.code === 3) {
          navigator.geolocation.getCurrentPosition(
            (fallbackPos) => {
              resolve({
                latitude: fallbackPos.coords.latitude,
                longitude: fallbackPos.coords.longitude,
                accuracy: fallbackPos.coords.accuracy,
              });
            },
            (fallbackErr) => {
              reject(fallbackErr);
            },
            {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 60000,
            }
          );
        } else {
          reject(error);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
        ...options,
      }
    );
  });
}

/**
 * Retorna mensagem clara e amigável em caso de erro de geolocalização
 */
export function getGeolocationErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const err = error as { code?: number; message?: string };
    if (
      err.code === 1001 ||
      err.message === 'INSECURE_CONTEXT' ||
      (err.message && err.message.toLowerCase().includes('secure origins'))
    ) {
      return 'O GPS requer conexão HTTPS. Em conexões HTTP (192.168.x.x), o navegador bloqueia o GPS por segurança.';
    }
    if (err.code === 1) {
      return 'Permissão negada. Toque no ícone de configurações ao lado do link no navegador e autorize a localização.';
    }
    if (err.code === 2) {
      return 'Sinal de GPS indisponível no momento. Verifique se o GPS está ativado no celular.';
    }
    if (err.code === 3) {
      return 'Tempo limite ao buscar sinal de GPS. Tente novamente.';
    }
  }
  return 'Não foi possível obter a localização por GPS.';
}

/**
 * Identifica a rua e cidade a partir das coordenadas geográficas (Geocodificação Reversa)
 * Consulta primeiramente o OpenStreetMap Nominatim e, em caso de falha/contingência,
 * a API aberta BigDataCloud.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult> {
  const result: ReverseGeocodeResult = {
    address: '',
    number: '',
    city: '',
    latitude,
    longitude,
  };

  // 1ª Tentativa: OpenStreetMap (Nominatim)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        },
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};

      const road =
        addr.road ||
        addr.pedestrian ||
        addr.street ||
        addr.residential ||
        addr.suburb ||
        '';

      const houseNumber = addr.house_number || '';
      const city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.city_district ||
        addr.state_district ||
        '';

      if (road || city) {
        result.address = road;
        result.number = houseNumber;
        result.city = city;
        return result;
      }
    }
  } catch {
    // Falha silenciosa para tentar a contingência
  }

  // 2ª Tentativa: BigDataCloud (CORS-friendly, sem chave de API)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=pt`,
      {
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const road = data.localityInfo?.informative?.[0]?.name || data.locality || '';
      const city = data.city || data.locality || data.principalSubdivision || '';

      result.address = road;
      result.city = city;
    }
  } catch {
    // Offline ou ambas falharam: mantém apenas as coordenadas
  }

  return result;
}

/**
 * Formata o endereço completo de forma elegante para exibição
 * Ex: "Rua das Flores, 123 (Apto 102) - São Paulo"
 */
export function formatFullAddress(visit: {
  address?: string;
  number?: string;
  complement?: string;
  city?: string;
}): string {
  const parts: string[] = [];

  // Logradouro e Número
  if (visit.address?.trim()) {
    let streetPart = visit.address.trim();
    if (visit.number?.trim()) {
      streetPart += `, ${visit.number.trim()}`;
    }
    parts.push(streetPart);
  } else if (visit.number?.trim()) {
    parts.push(`Nº ${visit.number.trim()}`);
  }

  // Complemento
  if (visit.complement?.trim()) {
    parts.push(`(${visit.complement.trim()})`);
  }

  // Cidade
  if (visit.city?.trim()) {
    parts.push(visit.city.trim());
  }

  return parts.join(' - ') || '';
}

/**
 * Gera URL de navegação para o Google Maps
 * Prioriza coordenadas de GPS para exatidão milimétrica.
 */
export function getGoogleMapsUrl(visit: {
  address?: string;
  number?: string;
  complement?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}): string {
  if (typeof visit.latitude === 'number' && typeof visit.longitude === 'number') {
    return `https://www.google.com/maps/search/?api=1&query=${visit.latitude},${visit.longitude}`;
  }

  const fullAddr = formatFullAddress(visit);
  if (fullAddr) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddr)}`;
  }

  return 'https://maps.google.com';
}
