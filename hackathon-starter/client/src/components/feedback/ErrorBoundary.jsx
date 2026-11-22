import { Component } from 'react'
import { ErrorState } from './ErrorState'

/** Catches render errors so one broken widget doesn't blank the whole app. */
export class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <div className="p-6">
            <ErrorState
              title="This section crashed"
              error={this.state.error}
              onRetry={() => this.setState({ error: null })}
            />
          </div>
        )
      )
    }
    return this.props.children
  }
}
