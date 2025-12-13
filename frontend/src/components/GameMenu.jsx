import { useState } from 'react';
import './GameMenu.css';

export default function GameMenu({ onGameSelect }) {
  const games = [
    { 
      id: 1, 
      name: "Snake and Ladder Game Problem", 
      description: "Find minimum dice throws to reach the end",
      color: "linear-gradient(135deg, #FF6B8B 0%, #FFA500 100%)",
      icon: "🎲",
      status: "trending",
      gameType: "snakeLadder"
    },
    { 
      id: 2, 
      name: "Traffic Simulation", 
      description: "Find maximum flow in traffic network",
      color: "linear-gradient(135deg, #00D4AA 0%, #0088FF 100%)",
      icon: "🚦",
      status: "new",
      gameType: "traffic"
    },
    { 
      id: 3, 
      name: "Traveling Salesman", 
      description: "Find shortest route visiting all cities",
      color: "linear-gradient(135deg, #9D50BB 0%, #6E48AA 100%)",
      icon: "🧮",
      status: "hard",
      gameType: "tsp"
    },
    { 
      id: 4, 
      name: "Tower of Hanoi", 
      description: "Solve the classic disk puzzle",
      color: "linear-gradient(135deg, #FF8A00 0%, #FF2070 100%)",
      icon: "🏛️",
      status: "popular",
      gameType: "hanoi"
    },
    { 
      id: 5, 
      name: "Eight Queens Puzzle", 
      description: "Place 8 queens without conflicts",
      color: "linear-gradient(135deg, #F9CB28 0%, #FF4D4D 100%)",
      icon: "♕",
      status: "featured",
      gameType: "queens",
      target: "#/queens"
    }
  ];

  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>⚡</span>
          <h1 style={styles.title}>ALGO<span style={styles.titleHighlight}>VERSE</span></h1>
        </div>
        <p style={styles.subtitle}>Interactive Algorithm & Puzzle Games</p>
        
        <div style={styles.stats}>
          <div style={styles.statItem}>
            <span style={styles.statNumber}>{games.length}</span>
            <span style={styles.statLabel}>Games</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statNumber}>∞</span>
            <span style={styles.statLabel}>Possibilities</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statNumber}>24/7</span>
            <span style={styles.statLabel}>Available</span>
          </div>
        </div>
      </div>
      
      <div style={styles.grid}>
        {games.map((game) => {
          const isQueens = game.gameType === "queens";
          const isHanoi = game.gameType === "hanoi";
          const target = isQueens ? "#/queens" : isHanoi ? "#/hanoi" : "#";
          
          const handleCardClick = (e) => {
            // Don't stop propagation if clicking the button - let button handle it
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
              return;
            }
            e.stopPropagation();
            if (isQueens || isHanoi) {
              if (onGameSelect) {
                onGameSelect(game.gameType);
              } else {
                window.location.hash = target;
              }
            }
          };
          
          return (
            <div 
              key={game.id} 
              style={{
                ...styles.card,
                background: game.color,
                transform: hoveredCard === game.id ? 'translateY(-12px)' : 'translateY(0)',
                boxShadow: hoveredCard === game.id 
                  ? `0 25px 50px ${game.color.split('0%, ')[1].split('100%')[0]}40`
                  : '0 10px 30px rgba(0,0,0,0.3)'
              }}
              className="game-card"
              onMouseEnter={() => setHoveredCard(game.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={handleCardClick}
            >
              <div style={styles.cardBadge}>
                {game.status}
              </div>
              
              <div style={styles.cardIcon}>
                {game.icon}
              </div>
              
              <div style={styles.cardContent}>
                <h3 style={styles.gameName}>{game.name}</h3>
                <p style={styles.gameDescription}>{game.description}</p>
                
                <div style={styles.cardFooter}>
                  <div style={styles.difficulty}>
                    {Array.from({length: 3}).map((_, i) => (
                      <span 
                        key={i} 
                        style={{
                          ...styles.difficultyDot,
                          opacity: i < ['easy', 'popular'].includes(game.status) ? 1 : 0.3
                        }}
                      />
                    ))}
                  </div>
                  
                  <button 
                    style={styles.playButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isQueens || isHanoi) {
                        if (onGameSelect) {
                          onGameSelect(game.gameType);
                        } else {
                          window.location.hash = target;
                        }
                      }
                    }}
                  >
                    <span style={styles.playIcon}>▶</span>
                    Play Now
                  </button>
                </div>
              </div>
              
              <div style={styles.cardGlow} />
            </div>
          );
        })}
      </div>
      
      <div style={styles.footer}>
        <p style={styles.footerText}>© 2024 AlgoVerse • Interactive Learning Platform</p>
        <div style={styles.footerLinks}>
          <a href="#" style={styles.footerLink}>About</a>
          <a href="#" style={styles.footerLink}>API</a>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: 'calc(100vh - 70px)',
    background: 'linear-gradient(135deg, #0F0B1E 0%, #1A1A2E 100%)',
    padding: '40px 20px',
    paddingTop: '20px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    position: 'relative',
    overflow: 'visible',
    zIndex: 1,
    marginTop: '70px',
    width: '100%'
  },
  header: {
    textAlign: 'center',
    marginBottom: '60px',
    position: 'relative',
    zIndex: 2
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '15px',
    marginBottom: '20px'
  },
  logoIcon: {
    fontSize: '3.5rem',
    animation: 'float 3s ease-in-out infinite'
  },
  title: {
    fontSize: '4rem',
    fontWeight: '900',
    margin: '0',
    background: 'linear-gradient(135deg, #FF6B8B 30%, #00D4AA 70%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textShadow: '0 0 30px rgba(255,107,139,0.3)'
  },
  titleHighlight: {
    color: '#F9CB28'
  },
  subtitle: {
    fontSize: '1.3rem',
    color: '#A0A0C0',
    margin: '10px 0 40px',
    fontWeight: '300',
    letterSpacing: '1px'
  },
  stats: {
    display: 'flex',
    justifyContent: 'center',
    gap: '40px',
    marginTop: '40px',
    flexWrap: 'wrap'
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '20px',
    minWidth: '120px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.1)'
  },
  statNumber: {
    fontSize: '2.5rem',
    fontWeight: '800',
    color: '#F9CB28',
    marginBottom: '5px'
  },
  statLabel: {
    fontSize: '0.9rem',
    color: '#A0A0C0',
    textTransform: 'uppercase',
    letterSpacing: '2px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '30px',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px'
  },
  card: {
    borderRadius: '25px',
    padding: '0',
    overflow: 'hidden',
    position: 'relative',
    cursor: 'pointer',
    minHeight: '280px',
    border: '1px solid rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)',
    pointerEvents: 'auto'
  },
  cardBadge: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    background: 'rgba(0,0,0,0.6)',
    color: 'white',
    padding: '5px 15px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    backdropFilter: 'blur(5px)'
  },
  cardIcon: {
    position: 'absolute',
    top: '-30px',
    right: '-30px',
    fontSize: '8rem',
    opacity: 0.2,
    transform: 'rotate(15deg)'
  },
  cardContent: {
    padding: '30px',
    color: 'white',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: 2
  },
  gameName: {
    fontSize: '1.8rem',
    fontWeight: '700',
    margin: '0 0 15px 0',
    textShadow: '0 2px 10px rgba(0,0,0,0.3)'
  },
  gameDescription: {
    fontSize: '1rem',
    opacity: 0.9,
    margin: '0 0 25px 0',
    lineHeight: '1.6',
    color: 'rgba(255,255,255,0.8)'
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  difficulty: {
    display: 'flex',
    gap: '5px'
  },
  difficultyDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#FFD700',
    transition: 'opacity 0.3s ease'
  },
  playButton: {
    background: 'rgba(255,255,255,0.15)',
    border: '2px solid rgba(255,255,255,0.3)',
    color: 'white',
    padding: '12px 25px',
    borderRadius: '50px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    letterSpacing: '1px',
    pointerEvents: 'auto'
  },
  playIcon: {
    fontSize: '0.8rem',
    transition: 'transform 0.3s ease'
  },
  cardGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    background: 'radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%)',
    opacity: 0,
    transition: 'opacity 0.3s ease',
    pointerEvents: 'none'
  },
  footer: {
    marginTop: '80px',
    textAlign: 'center',
    padding: '40px 20px',
    borderTop: '1px solid rgba(255,255,255,0.1)'
  },
  footerText: {
    color: '#A0A0C0',
    fontSize: '0.9rem',
    marginBottom: '20px'
  },
  footerLinks: {
    display: 'flex',
    justifyContent: 'center',
    gap: '30px',
    flexWrap: 'wrap'
  },
  footerLink: {
    color: '#F9CB28',
    textDecoration: 'none',
    fontSize: '0.9rem',
    transition: 'color 0.3s ease'
  }
};