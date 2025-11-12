import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { Button, usePrefix } from '@carbon/react';
import { DownToBottom, UpToTop } from '@carbon/react/icons';

/**
 * LogScrollButtons - Scroll buttons specifically for the maximized log container
 * Appears when the log section is maximized and contains enough content to scroll
 */
const LogScrollButtons = ({ containerRef }) => {
  const carbonPrefix = usePrefix();
  const intl = useIntl();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  useEffect(() => {
    if (!containerRef?.current) {
      setShowScrollTop(false);
      setShowScrollBottom(false);
      return;
    }

    const container = containerRef.current;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      const isScrollable = scrollHeight > clientHeight;

      setShowScrollTop(isScrollable && scrollTop > 100);
      setShowScrollBottom(
        isScrollable && scrollHeight - scrollTop - clientHeight > 100
      );
    };

    handleScroll();

    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [ containerRef]);

  const scrollToTop = () => {
    if (containerRef?.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToBottom = () => {
    if (containerRef?.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const scrollTopMessage = intl.formatMessage({
    id: 'dashboard.logs.scrollToTop',
    defaultMessage: 'Scroll to top'
  });

  const scrollBottomMessage = intl.formatMessage({
    id: 'dashboard.logs.scrollToBottom',
    defaultMessage: 'Scroll to bottom'
  });

  if ((!showScrollTop && !showScrollBottom)) {
    return null;
  }

  return (
    <div className="tkn--log-scroll-buttons">
      {showScrollTop && (
        <Button
          className="tkn--log-scroll-button"
          hasIconOnly
          iconDescription={scrollTopMessage}
          kind="secondary"
          onClick={scrollToTop}
          renderIcon={() => (
            <UpToTop>
              <title>{scrollTopMessage}</title>
            </UpToTop>
          )}
          size="md"
          tooltipPosition="left"
        />
      )}
      {showScrollBottom && (
        <Button
          className="tkn--log-scroll-button"
          hasIconOnly
          iconDescription={scrollBottomMessage}
          kind="secondary"
          onClick={scrollToBottom}
          renderIcon={() => (
            <DownToBottom>
              <title>{scrollBottomMessage}</title>
            </DownToBottom>
          )}
          size="md"
          tooltipPosition="left"
        />
      )}
    </div>
  );
};

export default LogScrollButtons;