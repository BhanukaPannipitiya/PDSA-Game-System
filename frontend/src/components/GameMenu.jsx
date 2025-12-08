export default function GameMenu() {
  const games = [
    { 
      id: 1, 
      name: "Snake & Ladder", 
      description: "Classic board game with dice rolls and ladders",
      color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    },
    { 
      id: 2, 
      name: "Traffic Simulation", 
      description: "Simulate urban traffic flow and patterns",
      color: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
    },
    { 
      id: 3, 
      name: "Traveling Salesman", 
      description: "Solve the classic optimization problem",
      color: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
    },
    { 
      id: 4, 
      name: "Tower of Hanoi", 
      description: "Mathematical puzzle with disks and pegs",
      color: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
    },
    { 
      id: 5, 
      name: "Eight Queens Puzzle", 
      description: "Chess-based logic challenge",
      color: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
    }
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>PDSA Game System</h1>
        <p style={styles.subtitle}>Interactive Algorithm & Puzzle Games</p>
      </div>
      
      <div style={styles.grid}>
        {games.map((game) => (
          <div 
            key={game.id} 
            style={{
              ...styles.card,
              background: game.color
            }}
            className="game-card"
          >
            <div style={styles.cardContent}>
              <h3 style={styles.gameName}>{game.name}</h3>
              <p style={styles.gameDescription}>{game.description}</p>
              <button style={styles.playButton}>
                Play Now
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <style jsx>{`
        .game-card {
          transition: all 0.3s ease;
        }
        .game-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '40px 20px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  },
  header: {
    textAlign: 'center',
    marginBottom: '60px',
    color: 'white'
  },
  title: {
    fontSize: '3rem',
    fontWeight: '700',
    margin: '0 0 10px 0',
    textShadow: '0 4px 8px rgba(0,0,0,0.2)'
  },
  subtitle: {
    fontSize: '1.2rem',
    opacity: 0.9,
    margin: 0,
    fontWeight: '300'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '30px',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px'
  },
  card: {
    borderRadius: '20px',
    padding: '0',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
    cursor: 'pointer',
    minHeight: '200px'
  },
  cardContent: {
    padding: '30px',
    color: 'white',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    background: 'rgba(0,0,0,0.1)'
  },
  gameName: {
    fontSize: '1.5rem',
    fontWeight: '600',
    margin: '0 0 15px 0',
    textShadow: '0 2px 4px rgba(0,0,0,0.2)'
  },
  gameDescription: {
    fontSize: '1rem',
    opacity: 0.9,
    margin: '0 0 25px 0',
    lineHeight: '1.5'
  },
  playButton: {
    background: 'rgba(255,255,255,0.2)',
    border: '2px solid rgba(255,255,255,0.3)',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '50px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease',
    alignSelf: 'flex-start'
  }
};