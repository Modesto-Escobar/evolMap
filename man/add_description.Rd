\name{add_description}
\alias{add_description}
\title{Add description of the map.}
\description{
Add a description of the evolMap object to be showned on screen. 
}
\value{
Object of class \code{evolMap}.
}

\usage{
add_description(map, content = "", width = NULL)
}
\arguments{
\item{map}{an object of class \code{evolMap}.}
\item{content}{a character string indicating a description text for the graph.}
\item{width}{a percentage indicating the width for the description panel (25\% of the window by default).}
}
\author{
Modesto Escobar \email{modesto@usal.es}, Department of Sociology and Communication, University of Salamanca, Carlos Prieto \email{cprietos@usal.es}, and  David Barrios \email{metal@usal.es}, Bioinformatics Service, University of Salamanca.
}
\examples{
# create map
map <- create_map()
map <- add_description(map, "Lorem ipsum dolor sit amet, consectetur adipiscing elit.")

\dontrun{
# plot map
plot(map)
}
}
