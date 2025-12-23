#!/usr/bin/env python3

import csv
import argparse
import os

def generate_from_template(input_csv, template_file, output_dir):
    """
    Generates configuration files from a CSV and a template file.

    Args:
        input_csv (str): The path to the input CSV file.
        template_file (str): The path to the template file.
        output_dir (str): The path to the output directory.
    """
    
    # Create the output directory if it doesn't exist
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    try:
        with open(template_file, 'r') as f:
            template = f.read()
    except FileNotFoundError:
        print(f"Error: Template file not found at {template_file}")
        return

    try:
        with open(input_csv, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                output = template
                for header, value in row.items():
                    token = "{" + header + "}"
                    output = output.replace(token, value)
                
                # Assuming the first column is the intended filename
                try:
                    filename = row[next(iter(row))]
                    if '.' not in filename:
                        filename += '.txt'
                    output_filename = os.path.join(output_dir, filename)
                    with open(output_filename, 'w') as out_f:
                        out_f.write(output)
                    print(f"Generated {output_filename}")
                except IndexError:
                    print("Error: Could not determine filename from CSV row.")


    except FileNotFoundError:
        print(f"Error: Input CSV file not found at {input_csv}")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate configuration files from a CSV and a template.")
    parser.add_argument("-i", "--input", required=True, help="The input CSV file.")
    parser.add_argument("-t", "--template", required=True, help="The template file.")
    parser.add_argument("-o", "--output", required=True, help="The output folder to generate the new files.")
    args = parser.parse_args()
    generate_from_template(args.input, args.template, args.output)
