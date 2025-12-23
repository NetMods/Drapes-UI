export async function getGithubStar(repoUrl: string) {
  try {
    const url = `https://api.github.com/repos/${repoUrl}`
    const response = await fetch(url)
    const data = await response.json()
    return data.stargazers_count
  } catch (err) {
    console.error('Failed to fetch stars', err)
    return 0
  }
} 
