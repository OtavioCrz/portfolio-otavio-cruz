import { Component } from 'react'

/**
 * Fronteira de erro para o que é carregado sob demanda (palco 3D, política).
 *
 * Sem ela, um chunk que não chega — rede instável, bloqueador — ou um contexto
 * WebGL que não sobe lança um erro no render, e o React desmonta a raiz inteira:
 * a página fica em branco. Aqui o pedaço só some, e o resto do site segue.
 */
export default class ChunkBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}
