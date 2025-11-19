import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { useProfileQuery, useSendOrderMutation, useSyncCartMutation } from '../../api/hooks';
import styles from './cart.module.css';

// Конвертация валюты: RUB -> USD (примерно 1 USD = 100 RUB)
const RUB_TO_USD_RATE = 100;

function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === 'RUB' && toCurrency === 'USD') {
    return amount / RUB_TO_USD_RATE;
  }
  if (fromCurrency === 'USD' && toCurrency === 'RUB') {
    return amount * RUB_TO_USD_RATE;
  }
  return amount;
}

function formatCurrency(amount: number, currency: string, locale: string) {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount.toFixed(0)} ${currency}`;
  }
}

export function CartPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, clearCart, getTotal } = useCartStore();
  const user = useAuthStore((state) => state.user);
  const { data: profile } = useProfileQuery();
  const sendOrderMutation = useSendOrderMutation();
  const syncCartMutation = useSyncCartMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const locale = i18n.language === 'en' ? 'en-US' : 'ru-RU';
  const isEnglish = i18n.language === 'en';
  const displayCurrency = isEnglish ? 'USD' : 'RUB';

  const total = getTotal();
  const originalCurrency = items[0]?.currency || 'RUB';
  const displayTotal = convertCurrency(total, originalCurrency, displayCurrency);

  // Синхронизируем корзину с ботом при изменении
  useEffect(() => {
    if (profile?.phone && items.length > 0) {
      const timeoutId = setTimeout(() => {
        syncCartMutation.mutate({
          phone: profile.phone,
          items: items.map((item) => {
            const itemPrice = convertCurrency(item.price, item.currency, displayCurrency);
            return {
              id: item.id,
              name: item.name,
              type: item.type,
              quantity: item.quantity,
              price: itemPrice,
              currency: displayCurrency,
              description: item.description,
            };
          }),
          total: displayTotal,
          currency: displayCurrency,
        });
      }, 500); // Задержка для избежания слишком частых запросов
      
      return () => clearTimeout(timeoutId);
    }
  }, [items, displayTotal, displayCurrency, profile?.phone, isEnglish]);

  const handleCheckout = async () => {
    if (items.length === 0) {
      return;
    }

    const userPhone = profile?.phone;
    if (!userPhone) {
      alert(t('cart.phoneRequired', 'Необходимо указать номер телефона в профиле'));
      navigate('/profile');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await sendOrderMutation.mutateAsync({
        phone: userPhone,
        items: items.map((item) => {
          const itemPrice = convertCurrency(item.price, item.currency, displayCurrency);
          return {
            id: item.id,
            name: item.name,
            type: item.type,
            quantity: item.quantity,
            price: itemPrice,
            currency: displayCurrency,
          };
        }),
        total: displayTotal,
        currency: displayCurrency,
        userName: user ? `${user.firstName} ${user.lastName}` : undefined,
      });

      alert(response.message || t('cart.goToBot', 'Перейдите в бота для оплаты'));
      // Не очищаем корзину, чтобы пользователь мог посмотреть её в боте
    } catch (error) {
      console.error('Failed to send order:', error);
      alert(t('cart.orderError', 'Не удалось отправить заказ. Попробуйте еще раз.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className={styles.wrapper}>
        <header className={styles.header}>
          <h1 className="brand-heading">{t('cart.title', 'Корзина')}</h1>
        </header>
        <div className={styles.empty}>
          <p>{t('cart.empty', 'Корзина пуста')}</p>
          <button className={styles.button} onClick={() => navigate('/store')}>
            {t('cart.goToStore', 'Перейти в магазин')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <h1 className="brand-heading">{t('cart.title', 'Корзина')}</h1>
        <p>{t('cart.subtitle', 'Проверьте ваш заказ')}</p>
      </header>

      <div className={styles.content}>
        <div className={styles.items}>
          {items.map((item) => {
            const itemPrice = convertCurrency(item.price, item.currency, displayCurrency);
            const itemTotal = itemPrice * item.quantity;
            return (
              <div key={`${item.type}-${item.id}`} className={styles.item}>
                <div className={styles.itemInfo}>
                  <h3>{item.name}</h3>
                  {item.description && <p className={styles.description}>{item.description}</p>}
                  <div className={styles.itemMeta}>
                    <span className={styles.type}>
                      {item.type === 'package' ? t('cart.package', 'Пакет') : t('cart.service', 'Услуга')}
                    </span>
                    <span className={styles.price}>{formatCurrency(itemPrice, displayCurrency, locale)}</span>
                  </div>
                </div>
                <div className={styles.itemActions}>
                  <div className={styles.quantity}>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className={styles.quantityButton}
                    >
                      −
                    </button>
                    <span className={styles.quantityValue}>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className={styles.quantityButton}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className={styles.removeButton}
                  >
                    {t('cart.remove', 'Удалить')}
                  </button>
                </div>
                <div className={styles.itemTotal}>
                  {formatCurrency(itemTotal, displayCurrency, locale)}
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.summary}>
          <div className={styles.summaryContent}>
            <div className={styles.summaryRow}>
              <span>{t('cart.total', 'Итого')}</span>
              <span className={styles.totalAmount}>{formatCurrency(displayTotal, displayCurrency, locale)}</span>
            </div>
            <div className={styles.summaryActions}>
              <button className={styles.clearButton} onClick={clearCart}>
                {t('cart.clear', 'Очистить корзину')}
              </button>
              <button className={styles.checkoutButton} onClick={handleCheckout} disabled={isSubmitting || items.length === 0}>
                {isSubmitting ? t('cart.sending', 'Отправка...') : t('cart.checkout', 'Оформить заказ через Telegram')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

