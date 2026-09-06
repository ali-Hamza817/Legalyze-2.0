%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% wiley-article.cls, v1.1, 2017/05/26
% Developed by Overleaf.
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{wiley-article}[2017/05/26, v1.1]
\def\@jlogo{}\def\@jname{}\def\@jyear{}\def\@jpages{}\def\@jvolume{}\def\@jwebsite{}
\def\@runningauthor{}\def\@corraddress{}\def\@corremail{}\def\@presentaddress{}
\def\@papertype{original article}\def\@paperfield{}\def\@paperdoi{}\def\@paperreceived{}\def\@paperrevised{}\def\@paperaccepted{}\def\@papereditor{}
\newif\if@numrefs\newif\if@alpharefs\newif\if@amsrefs\newif\if@blindreview
\DeclareOption{num-refs}{\@numrefstrue\@alpharefsfalse\@amsrefsfalse}
\DeclareOption{alpha-refs}{\@numrefsfalse\@alpharefstrue\@amsrefsfalse}
\DeclareOption{ams-refs}{\@numrefsfalse\@alpharefsfalse\@amsrefstrue}
\DeclareOption{blind}{\@blindreviewtrue}
\ExecuteOptions{num-refs}\ProcessOptions\relax
\LoadClass[twoside]{article}

\RequirePackage[table]{xcolor}\RequirePackage{ifpdf}\RequirePackage{ifxetex}\RequirePackage{ifluatex}
\RequirePackage{mathtools}\RequirePackage{bm}\RequirePackage{graphicx}\RequirePackage{tabularx}
\RequirePackage{textcase}\RequirePackage{dashrule}\RequirePackage{ragged2e}\RequirePackage{authblk}
\RequirePackage[hyphens]{url}\RequirePackage{soul}\RequirePackage{xpatch}
\newif\ifxetexorluatex
\ifxetex\xetexorluatextrue\else\ifluatex\xetexorluatextrue\else\xetexorluatexfalse\fi\fi
\ifxetexorluatex\RequirePackage[framemethod=tikz]{mdframed}\else\ifpdf\RequirePackage[framemethod=tikz]{mdframed}\else\RequirePackage[framemethod=default]{mdframed}\RequirePackage{tikz}\fi\fi
\RequirePackage{silence}\WarningFilter{microtype}{tracking amount list}\WarningFilter{latex}{Reference `mdf@pagelabel}
\ifxetexorluatex
  \RequirePackage{microtype}\RequirePackage{fontspec}\RequirePackage[partial=upright]{unicode-math}
  \setmainfont[Ligatures=TeX]{Arial}\setsansfont[Ligatures=TeX]{Arial}
  %\setmathfont{TeX Gyre DejaVu Math}\setmathfont[range={\int}]{Latin Modern Math}
\else
  \RequirePackage{microtype}\RequirePackage[T1]{fontenc}\RequirePackage[utf8]{inputenc}\RequirePackage[default]{lato}
  \IfFileExists{newtxsf.sty}{\RequirePackage[cmintegrals,nosymbolsc]{newtxsf}}{}
  \ifpdf\SetTracking[spacing={500*,166,}]{encoding={*}}{80}\fi
\fi
\RequirePackage[paperwidth=171mm,paperheight=246mm,left=14.3mm,textwidth=142.4mm,lines=47,headsep=\baselineskip,headheight=16\p@,footskip=23\p@]{geometry}
\RequirePackage{alphalph}\newalphalph{\fnsymbolmult}[mult]{\@fnsymbol}{5}
\newcounter{authorfn}\setcounter{authorfn}{1}\newcommand{\authfn}[1]{\fnsymbolmult{#1}}
\newcommand{\presentadd}[2][]{
  \ifx\empty\@presentaddress\else\appto{\@presentaddress}{\\}{}{}\fi
  \appto{\@presentaddress}{\ifx\empty#1\else\textsuperscript{#1}\fi#2}{}{}
}
\newcommand{\jlogo}[1]{\def\@jlogo{#1}}\newcommand{\jname}[1]{\def\@jname{#1}}\newcommand{\jyear}[1]{\def\@jyear{#1}}\newcommand{\jvolume}[1]{\def\@jvolume{#1}}\newcommand{\jpages}[1]{\def\@jpages{#1}}\newcommand{\jwebsite}[1]{\def\@jwebsite{#1}}
\newcommand{\runningauthor}[1]{\def\@runningauthor{#1}}\newcommand{\corraddress}[1]{\def\@corraddress{#1}}\newcommand{\corremail}[1]{\def\@corremail{#1}}

\newcommand{\paperdoi}[1]{\def\@paperdoi{#1}}\newcommand{\paperreceived}[1]{\def\@paperreceived{#1}}\newcommand{\paperrevised}[1]{\def\@paperrevised{#1}}\newcommand{\paperaccepted}[1]{\def\@paperaccepted{#1}}\newcommand{\papereditor}[1]{\def\@papereditor{#1}}\newcommand{\papertype}[1]{\def\@papertype{#1}}\newcommand{\paperfield}[1]{\def\@paperfield{#1}}
\RequirePackage{scrextend}\changefontsizes[13\p@]{8\p@}
\ifxetexorluatex\newcommand{\allcaps}[2][10.0]{\addfontfeature{LetterSpace=#1}\MakeTextUppercase{#2}}\renewcommand{\textsc}[1]{{\addfontfeature{LetterSpace=10.0,Scale=0.8}\MakeTextUppercase{#1}}}\else\ifpdf\newcommand{\allcaps}[2][]{\textls*[#1]{\MakeTextUppercase{#2}}}\else\newcommand{\allcaps}[2][]{\MakeTextUppercase{#2}}\fi\fi
\RequirePackage[explicit]{titlesec}
\titleformat{\section}{\fontsize{10pt}{13\p@}\bfseries}{\thesection}{1em}{\textmd{|}\quad\allcaps{#1}}
\newcommand{\backmatter}{\titleformat{\section}{\fontsize{10pt}{13\p@}\bfseries}{}{0pt}{\allcaps{##1}}\titlespacing*{\section}{0pt}{ 1.5\baselineskip}{0.5\baselineskip}}
\ifxetexorluatex\titleformat{name=\section,numberless}{\fontsize{10pt}{13\p@}\bfseries}{}{0pt}{\textsc{#1}}\else\ifpdf\titleformat{name=\section,numberless}{\fontsize{10pt}{13\p@}\scshape\bfseries}{}{0pt}{\textls*{#1}}\else\titleformat{name=\section,numberless}{\fontsize{10pt}{13\p@}\scshape\bfseries}{}{0pt}{#1}\fi\fi
\titlespacing*{\section}{0pt}{1.5\baselineskip}{\baselineskip}\titlespacing*{name=\section,numberless}{0pt}{1.5\baselineskip}{0.5\baselineskip}
\titleformat{\subsection}{\fontsize{10pt}{13\p@}\bfseries}{\thesubsection}{1em}{\textmd{|}\quad#1}\titlespacing*{\subsection}{0pt}{1.5\baselineskip}{0.5\baselineskip}
\titleformat{\subsubsection}{\fontsize{10pt}{13\p@}\bfseries}{\thesubsubsection}{1em}{\textmd{|}\quad#1}\titlespacing*{\subsubsection}{0pt}{1.5\baselineskip}{0.5\baselineskip}
\ifxetexorluatex\titleformat{\paragraph}[hang]{\fontsize{8.5\p@}{13\p@}\fontspec{Arial}\color{black!75}}{\theparagraph}{0pt}{#1}\titleformat{name=\paragraph,numberless}[hang]{\fontsize{8.5\p@}{13\p@}\fontspec{Arial}}{}{0pt}{#1}\else\titleformat{\paragraph}[hang]{\fontsize{8.5\p@}{13\p@}\fontseries{eb}\selectfont\color{black!75}}{\theparagraph}{0pt}{#1}\titleformat{name=\paragraph,numberless}[hang]{\fontsize{8.5\p@}{13\p@}\fontseries{eb}\selectfont}{}{0pt}{#1}\fi
\titlespacing*{\paragraph}{0pt}{\baselineskip}{0pt}
\RequirePackage[flushmargin,bottom]{footmisc}\def\blfootnote{\gdef\@thefnmark{}\@footnotetext}\appto{\footnotelayout}{\fontsize{6\p@}{9\p@}\selectfont}\renewcommand{\footnoterule}{\noindent\textcolor{black!50}{\rule{\textwidth}{0.5\p@}}\vskip2\p@}
\RequirePackage{fancyhdr}\fancyhf{}\renewcommand{\headrule}{}\fancyhead[LO]{{\fontsize{7\p@}{13\p@}\selectfont\setlength{\arrayrulewidth}{.5\p@}\arrayrulecolor{black}\begin{tabularx}{\textwidth}{@{}X r | r @{}}\textsc{\@runningauthor} & & \thepage\\\hline\end{tabularx}}}
\fancyhead[LE]{{\fontsize{7\p@}{13\p@}\selectfont\setlength{\arrayrulewidth}{.5\p@}\arrayrulecolor{black}\begin{tabularx}{\textwidth}{@{}l | l >{\raggedleft\arraybackslash}X @{}}\thepage & & \textsc{\@runningauthor}\\\hline\end{tabularx}}}
\fancypagestyle{firstpage}{\fancyhead[L]{\fontsize{7\p@}{13\p@}\selectfont\setlength{\arrayrulewidth}{.5\p@}\arrayrulecolor{black}\begin{tabularx}{\textwidth}{@{}l | l | X @{}}\ifdefempty{\@paperreceived}{\multicolumn{3}{l}{}}{Received: \@paperreceived & Revised: \@paperrevised & Accepted: \@paperaccepted}\\\hline\ifdefempty{\@paperdoi}{}{\multicolumn{3}{@{}l}{DOI: \@paperdoi}}\end{tabularx}}\fancyfoot[L]{\fontsize{7\p@}{13\p@}\selectfont\begin{tabularx}{\textwidth}{@{}X  >{\centering\arraybackslash}X  r | r @{}}\hline\ifdefempty{\@paperreceived}{& & & }{\textit{\@jname}~\@jyear; \@jvolume: \@jpages & \@jwebsite & \textcopyright~\@jyear\space Wiley Periodicals, Inc. & }\thepage\end{tabularx}}}
\newcommand{\contrib}[2][]{\blfootnote{\textsuperscript{#1}#2}}
\setcounter{Maxaffil}{1}\renewcommand{\Authsep}{\quad|\quad}\renewcommand{\Authand}{\quad|\quad}\renewcommand{\Authands}{\quad|\quad}\renewcommand{\Authfont}{\fontsize{12\p@}{20pt}\bfseries\raggedright}\renewcommand{\Affilfont}{\fontsize{7\p@}{10pt}\selectfont\raggedright}\renewcommand\AB@authnote[1]{\textsuperscript{#1}}\patchcmd{\AB@affilsepx}{\\}{\\[3\p@]}{}{}\patchcmd{\@author}{\AB@authlist\\[\affilsep]\AB@affillist}{\AB@authlist}{}{}
\renewcommand{\maketitle}{
  \if@blindreview\def\AB@authlist{\Authfont Anonymous Authors}\def\AB@affillist{\Affilfont Anonymous Affiliations}\def\@runningauthor{Authors (Anon)}\def\@corraddress{Anon correspondence}\def\@corremail{anon@example.com}\def\@presentaddress{Anon present address}\fi
  \vspace*{\dimexpr 27\p@-2\baselineskip}\noindent\begingroup\setul{3\p@}{1\p@}\ifxetexorluatex\fontspec{Arial}\else\fontseries{eb}\selectfont\fi{\fontsize{9\p@}{15\p@}\allcaps[\ifxetexorluatex 20\else 200\fi]{\ul{\@papertype}}}\ifdefempty{\@jlogo}{\rule{0pt}{2em}}{\hfill\includegraphics[height=2em]{\@jlogo}}\\[2\p@]{\fontsize{8\p@}{15\p@}\ifxetexorluatex\addfontfeature{LetterSpace=20.0}\@paperfield\else\ifpdf\textls*[150]{\@paperfield}\else\@paperfield\fi\fi}\endgroup\vskip13\p@{\fontsize{18\p@}{23\p@}\bfseries\raggedright\@title\par}\vskip27\p@\noindent\begin{minipage}{0.8\textwidth}\@author\end{minipage}\vskip21\p@\thispagestyle{firstpage}
}
\newcommand{\wiley@affilmetadata}{\AB@affillist\par\vskip10pt\textbf{Correspondence}\\\@corraddress\\Email: \@corremail\par\ifx\empty\@presentaddress\else\vskip10pt\textbf{Present address}\\\@presentaddress\par\fi\vskip10pt\par\ifdefempty{\@papereditor}{}{\vskip10pt Editor: \@papereditor\par}}
\newcommand{\abbrevs}[1]{\blfootnote{\textbf{Abbreviations:} #1\\[-3\p@]}}
\RequirePackage{changepage}\RequirePackage{environ}\reversemarginpar\newlength{\wiley@affilmetadataheight}\newlength{\wiley@abstractheight}
\NewEnviron{wiley@abstract}{
  \newcommand{\keywords}[1]{\vskip8\p@\noindent{\bfseries\fontsize{7\p@}{13\p@}\allcaps[\ifxetexorluatex 20\else 200\fi]{keywords}\par}\noindent{\raggedright\fontsize{8\p@}{13\p@}\selectfont ##1\par}}
  \strictpagecheck\begin{adjustwidth*}{\dimexpr 54.9mm-6.5\p@}{}\setlength{\marginparsep}{-47mm}\setlength{\marginparwidth}{47mm}\settototalheight{\wiley@affilmetadataheight}{\parbox{\marginparwidth}{\wiley@affilmetadata}}\newsavebox{\wiley@abstractbox}\savebox{\wiley@abstractbox}{\parbox{\linewidth}{\begin{mdframed}[font=\fontsize{9\p@}{15\p@}\selectfont,topline=false,bottomline=false,leftline=true,rightline=false,backgroundcolor=black!10,middlelinewidth=6\p@,middlelinecolor=white,outerlinewidth=0.5\p@]\BODY\end{mdframed}}}
  \settototalheight{\wiley@abstractheight}{\usebox{\wiley@abstractbox}}\marginpar{\wiley@affilmetadata}\vskip-1.5em\begin{mdframed}[font=\fontsize{9\p@}{15\p@}\selectfont,topline=false,bottomline=false,leftline=true,rightline=false,backgroundcolor=black!10,middlelinewidth=6\p@,middlelinecolor=white,outerlinewidth=0.5\p@]\BODY\end{mdframed}\ifdimgreater{\wiley@affilmetadataheight}{\wiley@abstractheight}{\vskip\dimexpr\wiley@affilmetadataheight-\wiley@abstractheight+\baselineskip\relax}{}
}[\end{adjustwidth*}]\renewcommand{\abstract}{\wiley@abstract}\renewcommand{\endabstract}{\endwiley@abstract}
\RequirePackage{quoting}\quotingsetup{vskip=\baselineskip,indentfirst=false,font={itshape,RaggedRight,normalsize},leftmargin=26\p@,rightmargin=26\p@}\renewenvironment{quote}{\begin{quoting}}{\end{quoting}}\renewenvironment{quotation}{\begin{quoting}}{\end{quoting}}
\RequirePackage[inline]{enumitem}\setlist{nosep,font=\bfseries,leftmargin=*,align=left}\setlist[1]{topsep=\baselineskip,leftmargin=\parindent,labelsep=*,labelwidth=*}
\RequirePackage[tableposition=top]{caption}\DeclareCaptionFont{captionfont}{\fontsize{8\p@}{11\p@}\selectfont}\DeclareCaptionFont{boxcaption}{\fontsize{9\p@}{13\p@}\selectfont}
\ifxetexorluatex\DeclareCaptionFont{heavy}{\fontspec{Arial}}\DeclareCaptionLabelFormat{allcaps}{\addfontfeature{LetterSpace=15.0}{\MakeTextUppercase{#1}~#2}}\else\DeclareCaptionFont{heavy}{\fontseries{eb}}\ifpdf\DeclareCaptionLabelFormat{allcaps}{\textls[150]{\MakeTextUppercase{#1}~#2}}\else\DeclareCaptionLabelFormat{allcaps}{\MakeTextUppercase{#1}~#2}\fi\fi
\captionsetup*{justification=raggedright,singlelinecheck=false,font=captionfont,labelformat=allcaps,labelfont={heavy},labelsep=quad}\captionsetup*[table]{skip=0.5ex}
\AtBeginEnvironment{table}{\fontsize{7.5\p@}{10.5\p@}\selectfont\rowcolors*{3}{black!10}{}\renewcommand{\arraystretch}{1.25}\arrayrulecolor{black!20}\setlength{\arrayrulewidth}{1\p@}}
\RequirePackage{threeparttable}\renewcommand{\TPTnoteSettings}{\leftmargin=0pt}\newcommand{\headrow}{\rowcolor{black!20}}\newcommand{\thead}[1]{\multicolumn{1}{l}{\bfseries #1\rule[-1.2ex]{0pt}{2em}}}
\if@numrefs\RequirePackage[numbers]{natbib}\fi
\if@alpharefs\RequirePackage{natbib}\fi
\if@amsrefs\RequirePackage{amsrefs}\let\citep\cite\let\citet\ocite\renewcommand{\biblistfont}{\fontsize{7.5\p@}{10.5\p@}\selectfont}\fi
\AtBeginDocument{\@ifpackageloaded{natbib}{\setlength{\bibhang}{1.5em}\renewcommand{\bibfont}{\fontsize{7.5\p@}{10.5\p@}\selectfont}\renewcommand{\refname}{References}\renewcommand{\bibname}{References}}{}}
\RequirePackage{lettrine}\newenvironment{biography}[2][]{\begin{mdframed}[linewidth=0.5\p@,skipabove=1.5\baselineskip,innerleftmargin=6\p@,innerrightmargin=6\p@,innertopmargin=6\p@,innerbottommargin=6\p@]\ifstrequal{#1}{}{}{\lettrine[image,lines=5,findent=1em,nindent=0pt]{#1}{}}\bfseries\scshape #2}{\end{mdframed}}
\normalsize\pagestyle{fancy}
