/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login a user via UI
       */
      login(email: string, password: string): Chainable<void>
      
      /**
       * Custom command to simulate a long session
       */
      simulateLongSession(minutes: number): Chainable<void>
      
      /**
       * Custom command to capture console logs with role information
       */
      captureRoleLogs(): Chainable<void>
      
      /**
       * Custom command to wait for auth state to stabilize
       */
      waitForAuthStable(): Chainable<void>
      
      /**
       * Custom command to create a new tab and navigate to URL
       */
      openNewTab(url: string): Chainable<void>
      
      /**
       * Custom command to simulate tab being idle
       */
      simulateTabIdle(seconds: number): Chainable<void>
    }
  }
}

/**
 * Login command that handles UI login flow
 */
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login')
  cy.get('input[type="email"]').type(email)
  cy.get('input[type="password"]').type(password)
  cy.get('button[type="submit"]').click()
  cy.waitForAuthStable()
})

/**
 * Simulate a long session by advancing the browser's time
 */
Cypress.Commands.add('simulateLongSession', (minutes: number) => {
  const now = new Date()
  const future = new Date(now.getTime() + minutes * 60 * 1000)
  
  cy.window().then((win) => {
    cy.clock(future.getTime())
    cy.tick(minutes * 60 * 1000)
  })
})

/**
 * Capture and store console logs related to role information
 */
Cypress.Commands.add('captureRoleLogs', () => {
  cy.window().then((win) => {
    const logs: string[] = []
    const originalLog = win.console.log
    const originalWarn = win.console.warn
    const originalError = win.console.error
    const originalDebug = win.console.debug
    
    // Override console methods to capture role-related logs
    win.console.log = (...args: any[]) => {
      const message = args.join(' ')
      if (message.includes('role') || message.includes('ROLE_NULL_DEBUG')) {
        logs.push(`LOG: ${message}`)
      }
      originalLog.apply(win.console, args)
    }
    
    win.console.warn = (...args: any[]) => {
      const message = args.join(' ')
      if (message.includes('role') || message.includes('ROLE_NULL_DEBUG')) {
        logs.push(`WARN: ${message}`)
      }
      originalWarn.apply(win.console, args)
    }
    
    win.console.error = (...args: any[]) => {
      const message = args.join(' ')
      if (message.includes('role') || message.includes('ROLE_NULL_DEBUG')) {
        logs.push(`ERROR: ${message}`)
      }
      originalError.apply(win.console, args)
    }
    
    win.console.debug = (...args: any[]) => {
      const message = args.join(' ')
      if (message.includes('role') || message.includes('ROLE_NULL_DEBUG')) {
        logs.push(`DEBUG: ${message}`)
      }
      originalDebug.apply(win.console, args)
    }
    
    // Store logs in window object for later retrieval
    ;(win as any).__cypressRoleLogs = logs
  })
})

/**
 * Wait for authentication state to stabilize
 */
Cypress.Commands.add('waitForAuthStable', () => {
  // Wait for loading indicator to disappear
  cy.get('[data-testid="loading"]', { timeout: 10000 }).should('not.exist')
  
  // Alternative: wait for dashboard content or login form
  cy.get('body').should('contain', 'Dashboard').or('contain', 'Sign in')
  
  // Additional wait to ensure auth context has settled
  cy.wait(1000)
})

/**
 * Open a new tab and navigate to URL
 */
Cypress.Commands.add('openNewTab', (url: string) => {
  cy.window().then((win) => {
    win.open(url, '_blank')
  })
})

/**
 * Simulate tab being idle by triggering visibility change events
 */
Cypress.Commands.add('simulateTabIdle', (seconds: number) => {
  cy.window().then((win) => {
    // Simulate tab becoming hidden
    Object.defineProperty(win.document, 'visibilityState', {
      value: 'hidden',
      writable: true
    })
    
    // Dispatch visibility change event
    win.document.dispatchEvent(new Event('visibilitychange'))
    
    // Wait for the specified time
    cy.wait(seconds * 1000)
    
    // Simulate tab becoming visible again
    Object.defineProperty(win.document, 'visibilityState', {
      value: 'visible',
      writable: true
    })
    
    win.document.dispatchEvent(new Event('visibilitychange'))
  })
})
