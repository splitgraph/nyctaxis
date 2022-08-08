import argparse
import os.path
from pathlib import Path 
import pandas as pd

def validate_file(f):
    if not os.path.exists(f):
        raise argparse.ArgumentTypeError("{0} does not exist".format(f))
    return f

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="parquet2csv; depends on pandas", formatter_class=argparse.RawTextHelpFormatter)
    parser.add_argument("-i", "--input", dest="filename", required=True, type=validate_file,
                        help="Parquet file to be csv'd", metavar="FILE")
    args = parser.parse_args()
    df = pd.read_parquet(vars(args)['filename'])
    stem = Path(vars(args)['filename']).stem
    df.to_csv(stem + '.csv')