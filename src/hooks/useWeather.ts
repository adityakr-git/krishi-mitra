import { useState, useEffect } from 'react';

export interface WeatherData {
  temp: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
  conditionMain: string;
  conditionId: number;
  city: string;
  advisory: {
    hi: string;
    en: string;
  };
  isLive: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * Generates actionable agricultural advisory based on OpenWeather condition or temperature
 */
export function generateAgriculturalAdvisory(
  conditionId: number,
  conditionMain: string,
  temp: number
): { hi: string; en: string } {
  // Rain / Drizzle / Thunderstorm (OpenWeather condition codes 200-599) or Heavy Overcast (804)
  if (
    (conditionId >= 200 && conditionId < 600) ||
    conditionId === 804 ||
    ['Rain', 'Drizzle', 'Thunderstorm'].includes(conditionMain)
  ) {
    return {
      hi: '⚠️ बारिश की संभावना है। कृपया अपनी फसल को तिरपाल से ढक कर रखें और आज मंडी जाने से बचें।',
      en: '⚠️ Rain or heavy overcast expected. Please cover crops with tarpaulin and avoid going to the mandi today.'
    };
  }

  // Extreme Heat (Temp > 40°C)
  if (temp > 40) {
    return {
      hi: `🔥 आज बहुत गर्मी है (${Math.round(temp)}°C)। मंडी जाते समय पीने का पानी साथ रखें।`,
      en: `🔥 Extreme heat today (${Math.round(temp)}°C). Please carry plenty of drinking water while traveling to the mandi.`
    };
  }

  // Clear / Clouds (Normal harvest-friendly weather)
  return {
    hi: '☀️ मौसम साफ़ है। फसल की कटाई और मंडी ले जाने के लिए एकदम सही समय है।',
    en: '☀️ Weather is clear. Perfect time for harvesting and bringing produce to the mandi.'
  };
}

const FALLBACK_WEATHER: WeatherData = {
  temp: 32,
  humidity: 42,
  windSpeed: 12,
  description: 'साफ आसमान',
  icon: '01d',
  conditionMain: 'Clear',
  conditionId: 800,
  city: 'Gurugram',
  advisory: {
    hi: '☀️ मौसम साफ़ है। फसल की कटाई और मंडी ले जाने के लिए एकदम सही समय है।',
    en: '☀️ Weather is clear. Perfect time for harvesting and bringing produce to the mandi.'
  },
  isLive: false,
  loading: false,
  error: null
};

/**
 * useWeather Hook
 * Fetches real-time weather from OpenWeather API with graceful fallback
 */
export const useWeather = (
  latitude: number = 28.4350,
  longitude: number = 77.0120,
  language: string = 'hi'
) => {
  const [weather, setWeather] = useState<WeatherData>({
    ...FALLBACK_WEATHER,
    loading: true
  });

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchWeather = async () => {
      // Support Vite and Next.js public environment variables
      const apiKey = 
        import.meta.env.VITE_OPENWEATHER_API_KEY ||
        import.meta.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

      if (!apiKey) {
        setWeather({
          ...FALLBACK_WEATHER,
          loading: false
        });
        return;
      }

      try {
        const langParam = language === 'hi' ? 'hi' : 'en';
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&lang=${langParam}&appid=${apiKey}`;

        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) {
          throw new Error(`OpenWeather HTTP status ${response.status}`);
        }

        const data = await response.json();

        if (isMounted && data && data.main && data.weather?.[0]) {
          const temp = Math.round(data.main.temp);
          const conditionId = data.weather[0].id || 800;
          const conditionMain = data.weather[0].main || 'Clear';
          const advisory = generateAgriculturalAdvisory(conditionId, conditionMain, temp);

          setWeather({
            temp,
            humidity: data.main.humidity || 45,
            windSpeed: Math.round((data.wind?.speed || 3) * 3.6), // m/s to km/h
            description: data.weather[0].description || (language === 'hi' ? 'साफ आसमान' : 'Clear Sky'),
            icon: data.weather[0].icon || '01d',
            conditionMain,
            conditionId,
            city: data.name || 'Gurugram',
            advisory,
            isLive: true,
            loading: false,
            error: null
          });
        }
      } catch (err: any) {
        if (err.name !== 'AbortError' && isMounted) {
          console.warn('[OpenWeather API] Could not fetch live weather, using graceful fallback:', err.message);
          // Fails gracefully with fallback weather state
          setWeather({
            ...FALLBACK_WEATHER,
            loading: false,
            error: err.message
          });
        }
      }
    };

    fetchWeather();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [latitude, longitude, language]);

  return weather;
};
