/*
Copyright 2019-2024 The Tekton Authors
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createHashRouter,
  Link,
  Navigate,
  Outlet,
  RouterProvider,
  useLocation,
  useNavigate
} from 'react-router-dom';
import { IntlProvider, useIntl } from 'react-intl';
import {
  Button,
  Content,
  HeaderContainer,
  InlineNotification
} from '@carbon/react';
import { PageErrorBoundary } from '@tektoncd/dashboard-components';
import {
  ALL_NAMESPACES,
  getErrorMessage,
  urls,
  useWebSocketReconnected
} from '@tektoncd/dashboard-utils';
import { DownToBottom, UpToTop } from '@carbon/react/icons';

import {
  ErrorPage,
  Header,
  HeaderBarContent,
  LoadingShell,
  NotFound
} from '..';

import {
  NamespaceContext,
  useDefaultNamespace,
  useExtensions,
  useNamespaces,
  useProperties,
  useSelectedNamespace,
  useTenantNamespaces
} from '../../api';
import { defaultLocale, getLocale } from '../../utils';
import routes from '../../routes';

import '../../scss/App.scss';

/* istanbul ignore next */
const ConfigErrorComponent = ({ loadingConfigError }) => {
  const intl = useIntl();
  if (!loadingConfigError) {
    return null;
  }

  return (
    <InlineNotification
      kind="error"
      title={intl.formatMessage({
        id: 'dashboard.app.loadingConfigError',
        defaultMessage: 'Error loading configuration'
      })}
      subtitle={getErrorMessage(loadingConfigError)}
      lowContrast
    />
  );
};

const ConfigError = ConfigErrorComponent;

async function loadMessages(lang) {
  const loadedMessages = (await import(`../../nls/messages_${lang}.json`))
    .default;
  /* istanbul ignore next */
  if (import.meta.env.MODE === 'i18n:pseudo') {
    const startBoundary = '[[%';
    const endBoundary = '%]]';
    // Make it easier to identify untranslated strings in the UI
    Object.keys(loadedMessages).forEach(messageId => {
      if (loadedMessages[messageId].startsWith(startBoundary)) {
        // avoid repeating the boundaries when
        // hot reloading in dev mode
        return;
      }
      loadedMessages[messageId] =
        `${startBoundary}${loadedMessages[messageId]}${endBoundary}`;
    });
  }

  return loadedMessages;
}

function HeaderNameLink(props) {
  return <Link {...props} to={urls.about()} />;
}

function ScrollButtons() {
  const intl = useIntl();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [isLogMaximized, setIsLogMaximized] = useState(false);
  const [elementVersion, setElementVersion] = useState(0); // Track when element changes
  const stepDetailsRef = useRef(null);

  const handleScroll = useCallback(() => {
    let scrollTop, scrollHeight, clientHeight;

    // Check if we should use the stepDetails container
    const stepDetails = stepDetailsRef.current;

    if (isLogMaximized && stepDetails) {
      scrollTop = stepDetails.scrollTop;
      scrollHeight = stepDetails.scrollHeight;
      clientHeight = stepDetails.clientHeight;
    } else {
      scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      scrollHeight = document.documentElement.scrollHeight;
      clientHeight = document.documentElement.clientHeight;
    }

    const isScrollable = scrollHeight > clientHeight;

    setShowScrollTop(scrollTop > 300);
    setShowScrollBottom(
      isScrollable && scrollHeight - scrollTop - clientHeight > 100
    );
  }, [isLogMaximized]);

  // Watch for the stepDetails element to appear and track its maximized state
  useEffect(() => {
    const checkForStepDetails = () => {
      const stepDetails = document.querySelector('.tkn--step-details');

      // Update ref if we found an element and it's different from current - switching pages need to update ref
      // OR if current ref no longer exists in the DOM
      const needsUpdate =
        stepDetails &&
        (stepDetails !== stepDetailsRef.current ||
          !document.body.contains(stepDetailsRef.current));

      if (needsUpdate) {
        stepDetailsRef.current = stepDetails;
        setElementVersion(v => v + 1); // Trigger re-attachment of listeners

        // Check initial maximized state
        const isMaximized = stepDetails.classList.contains(
          'tkn--taskrun--maximized'
        );
        setIsLogMaximized(isMaximized);
        handleScroll();
      }

      // Clear ref if element no longer exists
      if (!stepDetails && stepDetailsRef.current) {
        stepDetailsRef.current = null;
        setElementVersion(v => v + 1); // Trigger re-attachment of listeners
        setIsLogMaximized(false);
        handleScroll();
      }
    };

    // Check immediately
    checkForStepDetails();

    // Check periodically as a fallback (every 500ms) ??
    // const interval = setInterval(checkForStepDetails, 500);

    // Use MutationObserver to watch for the element appearing/disappearing in the DOM
    const bodyObserver = new MutationObserver(checkForStepDetails);
    bodyObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      bodyObserver.disconnect();
      //clearInterval(interval);
    };
  }, [handleScroll]);

  // Watch for class changes on stepDetails (maximized state)
  useEffect(() => {
    const stepDetails = stepDetailsRef.current;
    if (!stepDetails) {
      return null;
    }

    const checkMaximizedState = () => {
      const isMaximized = stepDetails.classList.contains(
        'tkn--taskrun--maximized'
      );
      setIsLogMaximized(isMaximized);
      // Use setTimeout to ensure state update completes before scroll check
      setTimeout(() => handleScroll(), 0);
    };

    const classObserver = new MutationObserver(() => {
      checkMaximizedState();
    });

    classObserver.observe(stepDetails, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Initial check
    checkMaximizedState();

    return () => {
      classObserver.disconnect();
    };
  }, [handleScroll, elementVersion]); // Re-run when element changes

  // Handle scroll events for both window and stepDetails
  useEffect(() => {
    const onScroll = () => handleScroll();
    const onResize = () => handleScroll();

    // Always listen to window scroll
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    // Listen to stepDetails scroll if it exists
    const stepDetails = stepDetailsRef.current;
    if (stepDetails) {
      stepDetails.addEventListener('scroll', onScroll, { passive: true });
    }

    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (stepDetails) {
        stepDetails.removeEventListener('scroll', onScroll);
      }
    };
  }, [handleScroll, isLogMaximized, elementVersion]); // Re-run when element changes

  const scrollTo = position => {
    const stepDetails = stepDetailsRef.current;

    if (isLogMaximized && stepDetails) {
      stepDetails.scrollTo({ top: position, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: position, behavior: 'smooth' });
    }
  };

  const scrollToTop = () => scrollTo(0);

  const scrollToBottom = () => {
    const stepDetails = stepDetailsRef.current;
    let scrollHeight;

    if (isLogMaximized && stepDetails) {
      scrollHeight = stepDetails.scrollHeight;
    } else {
      scrollHeight = document.documentElement.scrollHeight;
    }

    scrollTo(scrollHeight);
  };

  if (!showScrollTop && !showScrollBottom) {
    return null;
  }

  const scrollTopMessage = intl.formatMessage({
    id: 'dashboard.app.scrollToTop',
    defaultMessage: 'Scroll to top'
  });

  const scrollBottomMessage = intl.formatMessage({
    id: 'dashboard.app.scrollToBottom',
    defaultMessage: 'Scroll to bottom'
  });

  return (
    <div className="tkn--scroll-buttons">
      {showScrollTop && (
        <Button
          className="tkn--scroll-button"
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
          className="tkn--scroll-button"
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
}
function Root() {
  const lang = getLocale(navigator.language);
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { error: propertiesError } =
    queryClient.getQueryState(['properties']) || {};
  const { error: messagesError } =
    queryClient.getQueryState(['i18n', lang]) || {};
  const loadingConfigError = propertiesError || messagesError;
  const defaultNamespace = useDefaultNamespace();
  const { selectNamespace } = useSelectedNamespace();

  if (location.state?.fromDefaultRoute && defaultNamespace) {
    setTimeout(() => {
      selectNamespace(defaultNamespace);
      // reset state to disable defaulting behaviour and allow
      // user to select different namespace after initial load
      navigate(location.pathname, { replace: true, state: {} });
    }, 0);
  }

  return (
    <>
      <HeaderContainer
        isSideNavExpanded
        render={({ isSideNavExpanded, onClickSideNavExpand }) => (
          <Header
            headerNameProps={{
              as: HeaderNameLink
            }}
            isSideNavExpanded={isSideNavExpanded}
            onHeaderMenuButtonClick={onClickSideNavExpand}
          >
            <HeaderBarContent />
          </Header>
        )}
      />

      <Content
        id="main-content"
        className="tkn--main-content"
        aria-labelledby="main-content-header"
        tabIndex="0"
      >
        <ConfigError loadingConfigError={loadingConfigError} />
        <PageErrorBoundary>
          <Outlet />
        </PageErrorBoundary>
      </Content>

      <ScrollButtons />
    </>
  );
}

const router = createHashRouter([
  {
    path: '/',
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
      {
        errorElement: <ErrorPage />,
        children: [
          {
            index: true,
            element: (
              <Navigate
                to={urls.about()}
                replace
                state={{ fromDefaultRoute: true }}
              />
            )
          },
          ...routes.dashboard,
          ...routes.pipelines,
          ...routes.triggers,
          {
            path: '*',
            element: <NotFound />
          }
        ]
      }
    ]
  }
]);

/* istanbul ignore next */
export function App() {
  const lang = getLocale(navigator.language);
  const {
    isFetching: isFetchingProperties,
    isPlaceholderData: isPropertiesPlaceholder
  } = useProperties();
  const tenantNamespaces = useTenantNamespaces();

  const [selectedNamespace, setSelectedNamespace] = useState(
    tenantNamespaces[0] || ALL_NAMESPACES
  );

  const {
    data: messages,
    isFetching: isFetchingMessages,
    isPlaceholderData: isMessagesPlaceholder
  } = useQuery({
    queryKey: ['i18n', lang],
    queryFn: () => loadMessages(lang),
    placeholderData: {}
  });

  const showLoadingState = isPropertiesPlaceholder || isMessagesPlaceholder;
  const isFetchingConfig = isFetchingProperties || isFetchingMessages;

  const { isWebSocketConnected } = useExtensions(
    { namespace: tenantNamespaces[0] || ALL_NAMESPACES },
    { enabled: !isFetchingConfig }
  );

  const queryClient = useQueryClient();

  useNamespaces({
    enabled: !isFetchingConfig && !tenantNamespaces.length
  });
  useWebSocketReconnected(
    () => queryClient.invalidateQueries(),
    isWebSocketConnected
  );

  const namespaceContext = useMemo(
    () => ({
      selectedNamespace,
      selectNamespace: setSelectedNamespace
    }),
    [selectedNamespace]
  );

  return (
    <NamespaceContext.Provider value={namespaceContext}>
      <IntlProvider
        defaultLocale={defaultLocale}
        locale={messages ? lang : defaultLocale}
        messages={messages}
      >
        {showLoadingState && <LoadingShell />}
        {!showLoadingState && <RouterProvider router={router} />}
      </IntlProvider>
    </NamespaceContext.Provider>
  );
}

export default App;
