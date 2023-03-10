\name{sociologists}
\alias{sociologists}
\docType{data}
\title{
Data: Classical sociologists.
}
\description{
Data frame with names, birth and death year data, birth country and school of thought.
}
\usage{data("sociologists")}
\format{
  A data frame of 16 sociologists with 11 variables to study time coincidences:
  \describe{
    \item{\code{name}}{: first and last name of the sociologist.}
    \item{\code{birth}}{: birth year.}
    \item{\code{death}}{: death year.}
    \item{\code{birth_place}}{: birth city.}
    \item{\code{birth_country}}{: birth country.}
    \item{\code{death_place}}{: death city.}
    \item{\code{death_country}}{: death country.}
    \item{\code{label}}{: combination of name, birth and death dates.}
    \item{\code{generation}}{: generation (every 25 years) of the sociologist.}
    \item{\code{school}}{: school of thought.}
    \item{\code{picture}}{: name and path of the file where their picture is.}
    }
}
\source{
Own elaboration from manuals of sociology.
}
\examples{
data(sociologists)
head(sociologists, 10)
tail(sociologists, 10)
}
\keyword{datasets}
